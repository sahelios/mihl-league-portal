import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { googleOAuthSDK } from "./googleOAuth";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

interface StateData {
  origin: string;
  returnPath: string;
}

function decodeState(state: string): { origin: string; returnPath: string } {
  try {
    const decoded = atob(state);
    const stateData = JSON.parse(decoded) as StateData;
    return {
      origin: stateData.origin || window.location.origin,
      returnPath: stateData.returnPath || "/"
    };
  } catch (error) {
    console.error("[Google OAuth] Failed to decode state:", error);
    return {
      origin: "https://mihl.ca",
      returnPath: "/"
    };
  }
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");
    const errorDescription = getQueryParam(req, "error_description");

    console.log("[Google OAuth] Callback received", {
      hasCode: !!code,
      hasState: !!state,
      error,
      errorDescription,
    });

    if (error) {
      console.error("[Google OAuth] Error from Google:", error, errorDescription);
      res.status(400).json({ error: `Google OAuth error: ${error}` });
      return;
    }

    if (!code || !state) {
      console.error("[Google OAuth] Missing code or state", { code: !!code, state: !!state });
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      // Construct the redirect_uri that matches what was registered in Google Cloud Console
      // This must be the full callback URL, not the page to redirect to
      // Use X-Forwarded headers for Cloud Run behind load balancer
      // Decode state to get the exact origin used in the authorization request
      const stateData = decodeState(state);
      const redirectUri = `${stateData.origin}/api/oauth/callback`;
      console.log("[Google OAuth] Using redirect URI for token exchange:", redirectUri);
      console.log("[Google OAuth] State data:", stateData);
      
      const session = await googleOAuthSDK.exchangeCodeForSession(code, redirectUri);
      console.log("[Google OAuth] Session created for:", session.userInfo.email);

      const sessionToken = await googleOAuthSDK.createSessionToken(
        session.userInfo.id,
        session.userInfo.email,
        session.userInfo.name,
        { expiresInMs: ONE_YEAR_MS }
      );

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to the page specified in state
      res.redirect(302, stateData.returnPath || "/");
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed", details: String(error) });
    }
  });
}
