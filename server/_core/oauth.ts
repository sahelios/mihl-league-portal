import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { googleOAuthSDK } from "./googleOAuth";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function decodeState(state: string): string {
  // State is just a simple value, not encoded
  // Return the home page as default redirect
  return "/";
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
      const protocol = req.protocol;
      const host = req.get('host');
      const redirectUri = `${protocol}://${host}/api/oauth/callback`;
      console.log("[Google OAuth] Using redirect URI for token exchange:", redirectUri);
      
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

      // Decode state to get the page to redirect to after login
      const returnPath = decodeState(state);
      res.redirect(302, returnPath || "/");
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed", details: String(error) });
    }
  });
}
