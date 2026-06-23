export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate Google OAuth login URL at runtime
export const getLoginUrl = (returnPath?: string) => {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  
  // Encode origin and optional return path in state
  // This ensures the backend can reconstruct the exact same redirect_uri
  const stateData = JSON.stringify({
    origin: window.location.origin,
    returnPath: returnPath || "/"
  });
  const state = btoa(stateData);

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  // Force Google to show the account selection screen.
  // Without this, Google silently re-authenticates the user after logout
  // (if they still have an active Google session), causing an auto-relogin loop.
  url.searchParams.set("prompt", "select_account");

  return url.toString();
};
