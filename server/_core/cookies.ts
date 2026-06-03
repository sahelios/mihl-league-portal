import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request,
  stateOrigin?: string
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // Prefer X-Forwarded-Host (from proxy) over req.hostname
  const forwardedHost = req.get("x-forwarded-host");
  const hostname = forwardedHost ? forwardedHost.split(",")[0].trim() : req.hostname;
  
  // If stateOrigin is provided (from OAuth), use it to determine domain
  let domain: string | undefined;
  const hostToCheck = stateOrigin ? new URL(stateOrigin).hostname : hostname;

  // Set domain for production domains to allow cross-subdomain access
  if (hostToCheck && !LOCAL_HOSTS.has(hostToCheck) && !isIpAddress(hostToCheck)) {
    // For mihl.ca, set domain to .mihl.ca so cookie works for www.mihl.ca too
    if (hostToCheck.includes("mihl.ca")) {
      domain = ".mihl.ca";
    }
    // For Manus preview domains, don't set domain (host-specific)
    // For other domains, don't set domain (host-specific)
  }

  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
  };
}
