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
    // Always require origin in state - never use window.location.origin on server
    if (!stateData.origin) {
      throw new Error("Missing origin in state");
    }
    return {
      origin: stateData.origin,
      returnPath: stateData.returnPath || "/"
    };
  } catch (error) {
    console.error("[Google OAuth] Failed to decode state:", error);
    // Fallback to https://mihl.ca if state decode fails
    return {
      origin: "https://mihl.ca",
      returnPath: "/"
    };
  }
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    // Ensure Cloudflare doesn't cache this response or strip Set-Cookie header
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
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
      console.log("[Google OAuth] Session created, userInfo:", JSON.stringify(session.userInfo));
      console.log("[Google OAuth] Session created for:", session.userInfo.email);
      console.log("[Google OAuth] About to call createSessionToken");

      const sessionToken = await googleOAuthSDK.createSessionToken(
        session.userInfo.id,
        session.userInfo.email,
        session.userInfo.name,
        { expiresInMs: ONE_YEAR_MS }
      );
      console.log("[Google OAuth] Session token created");
      console.log("[Google OAuth] Session token length:", sessionToken.length);

      // Manually construct Set-Cookie header to ensure it's set
      // This bypasses any issues with res.cookie() not working properly
      const maxAgeSeconds = Math.floor(ONE_YEAR_MS / 1000);
      const setCookieValue = `${COOKIE_NAME}=${sessionToken}; Domain=.mihl.ca; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=None`;
      res.setHeader('Set-Cookie', setCookieValue);
      console.log("[Google OAuth] Set-Cookie header manually set");
      console.log("[Google OAuth] Set-Cookie value (first 100 chars):", setCookieValue.substring(0, 100) + '...');
      console.log("[Google OAuth] Response headers after manual cookie:", res.getHeaders());

      // Return 200 with client-side redirect instead of 302
      // This prevents Cloudflare from stripping the Set-Cookie header
      const redirectUrl = new URL(stateData.returnPath || "/", stateData.origin).toString();
      console.log("[Google OAuth] Redirecting to:", redirectUrl);
      
      // Send HTML with JavaScript redirect to ensure Set-Cookie is sent with 200 response
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Redirecting...</title>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
</head>
<body>
  <p>Redirecting to <a href="${redirectUrl}">${redirectUrl}</a>...</p>
  <script>
    window.location.href = '${redirectUrl}';
  </script>
</body>
</html>`;
      res.status(200).send(htmlContent);
      console.log("[Google OAuth] Sent 200 with client-side redirect");
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed", details: String(error) });
    }
  });
}
