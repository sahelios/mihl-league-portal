import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const shouldSetDomain =
    hostname &&
    !LOCAL_HOSTS.has(hostname) &&
    !isIpAddress(hostname) &&
    hostname !== "127.0.0.1" &&
    hostname !== "::1";

  const domain =
    shouldSetDomain && !hostname.startsWith(".")
      ? `.${hostname}`
      : shouldSetDomain
        ? hostname
        : undefined;

  // Use sameSite: 'lax' instead of 'none'.
  //
  // 'none' requires Secure:true — but whether the Secure flag is set depends
  // on whether the proxy correctly forwards x-forwarded-proto. If the OAuth
  // callback sets the cookie with Secure:true but the logout tRPC call clears
  // it without Secure (because the proxy headers differ), the browser silently
  // rejects the clearCookie and the user appears permanently logged in.
  //
  // 'lax' has no Secure requirement and works correctly for same-origin apps
  // (browser at mihl.ca making requests to mihl.ca). The Google OAuth redirect
  // is a top-level GET navigation so cookies are still sent with 'lax'.
  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: req.secure, // works correctly now that 'trust proxy' is set
  };
}
