import { describe, it, expect, vi } from "vitest";
import type { Request } from "express";
import { getSessionCookieOptions } from "./_core/cookies";

describe("Session Cookie Domain Configuration", () => {
  function createMockRequest(hostname: string, protocol: string = "https", forwardedProto?: string, forwardedHost?: string): Partial<Request> {
    const req: Partial<Request> = {
      hostname,
      protocol,
      headers: {},
      get: (name: string) => {
        if (name.toLowerCase() === "x-forwarded-host") return forwardedHost;
        if (name.toLowerCase() === "x-forwarded-proto") return forwardedProto;
        return undefined;
      },
    };
    return req;
  }

  it("should set domain to .mihl.ca for mihl.ca hostname", () => {
    const req = createMockRequest("mihl.ca");
    const options = getSessionCookieOptions(req as Request);
    expect(options.domain).toBe(".mihl.ca");
  });

  it("should set domain to .mihl.ca for www.mihl.ca hostname", () => {
    const req = createMockRequest("www.mihl.ca");
    const options = getSessionCookieOptions(req as Request);
    expect(options.domain).toBe(".mihl.ca");
  });

  it("should set domain to .mihl.ca for any mihl.ca subdomain", () => {
    const req = createMockRequest("api.mihl.ca");
    const options = getSessionCookieOptions(req as Request);
    expect(options.domain).toBe(".mihl.ca");
  });

  it("should not set domain for localhost", () => {
    const req = createMockRequest("localhost");
    const options = getSessionCookieOptions(req as Request);
    expect(options.domain).toBeUndefined();
  });

  it("should not set domain for 127.0.0.1", () => {
    const req = createMockRequest("127.0.0.1");
    const options = getSessionCookieOptions(req as Request);
    expect(options.domain).toBeUndefined();
  });

  it("should not set domain for Manus preview domain", () => {
    const req = createMockRequest("menschelhq-fde3d448.manus.space");
    const options = getSessionCookieOptions(req as Request);
    expect(options.domain).toBeUndefined();
  });

  it("should set sameSite to none for all requests", () => {
    const req = createMockRequest("mihl.ca");
    const options = getSessionCookieOptions(req as Request);
    expect(options.sameSite).toBe("none");
  });

  it("should set httpOnly to true for all requests", () => {
    const req = createMockRequest("mihl.ca");
    const options = getSessionCookieOptions(req as Request);
    expect(options.httpOnly).toBe(true);
  });

  it("should set path to / for all requests", () => {
    const req = createMockRequest("mihl.ca");
    const options = getSessionCookieOptions(req as Request);
    expect(options.path).toBe("/");
  });

  it("should set secure to true for https requests", () => {
    const req = createMockRequest("mihl.ca", "https");
    const options = getSessionCookieOptions(req as Request);
    expect(options.secure).toBe(true);
  });

  it("should set secure to true when x-forwarded-proto is https", () => {
    const req = createMockRequest("mihl.ca", "http");
    // Set x-forwarded-proto in headers for isSecureRequest check
    req.headers!["x-forwarded-proto"] = "https";
    const options = getSessionCookieOptions(req as Request);
    expect(options.secure).toBe(true);
  });

  it("should set secure to false for http requests without x-forwarded-proto", () => {
    const req = createMockRequest("mihl.ca", "http");
    const options = getSessionCookieOptions(req as Request);
    expect(options.secure).toBe(false);
  });

  it("should allow cookie to work across mihl.ca and www.mihl.ca with .mihl.ca domain", () => {
    // When domain is .mihl.ca, browsers will send the cookie to:
    // - mihl.ca
    // - www.mihl.ca
    // - api.mihl.ca
    // - any subdomain of mihl.ca
    const req = createMockRequest("mihl.ca");
    const options = getSessionCookieOptions(req as Request);
    expect(options.domain).toBe(".mihl.ca");
    // This ensures the cookie will be sent to all subdomains
  });
});
