import { describe, it, expect } from "vitest";

describe("OAuth Callback State Decoding", () => {
  // Helper function to encode state (same as client)
  function encodeState(origin: string, returnPath: string = "/"): string {
    const stateData = { origin, returnPath };
    return btoa(JSON.stringify(stateData));
  }

  // Helper function to decode state (same as server)
  function decodeState(state: string): { origin: string; returnPath: string } {
    try {
      const decoded = atob(state);
      const stateData = JSON.parse(decoded) as { origin: string; returnPath: string };
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

  it("should decode state with origin and returnPath", () => {
    const state = encodeState("https://mihl.ca", "/dashboard");
    const decoded = decodeState(state);
    expect(decoded.origin).toBe("https://mihl.ca");
    expect(decoded.returnPath).toBe("/dashboard");
  });

  it("should decode state with only origin (default returnPath)", () => {
    const state = encodeState("https://mihl.ca");
    const decoded = decodeState(state);
    expect(decoded.origin).toBe("https://mihl.ca");
    expect(decoded.returnPath).toBe("/");
  });

  it("should decode state from www subdomain", () => {
    const state = encodeState("https://www.mihl.ca", "/register");
    const decoded = decodeState(state);
    expect(decoded.origin).toBe("https://www.mihl.ca");
    expect(decoded.returnPath).toBe("/register");
  });

  it("should fallback to https://mihl.ca on invalid state", () => {
    const decoded = decodeState("invalid-state-data");
    expect(decoded.origin).toBe("https://mihl.ca");
    expect(decoded.returnPath).toBe("/");
  });

  it("should fallback to https://mihl.ca on missing origin", () => {
    const invalidState = btoa(JSON.stringify({ returnPath: "/dashboard" }));
    const decoded = decodeState(invalidState);
    expect(decoded.origin).toBe("https://mihl.ca");
    expect(decoded.returnPath).toBe("/");
  });

  it("should construct absolute redirect URL correctly", () => {
    const state = encodeState("https://mihl.ca", "/dashboard");
    const decoded = decodeState(state);
    const redirectUrl = new URL(decoded.returnPath || "/", decoded.origin).toString();
    expect(redirectUrl).toBe("https://mihl.ca/dashboard");
  });

  it("should construct absolute redirect URL for www subdomain", () => {
    const state = encodeState("https://www.mihl.ca", "/register");
    const decoded = decodeState(state);
    const redirectUrl = new URL(decoded.returnPath || "/", decoded.origin).toString();
    expect(redirectUrl).toBe("https://www.mihl.ca/register");
  });

  it("should handle root path correctly", () => {
    const state = encodeState("https://mihl.ca", "/");
    const decoded = decodeState(state);
    const redirectUrl = new URL(decoded.returnPath || "/", decoded.origin).toString();
    expect(redirectUrl).toBe("https://mihl.ca/");
  });
});
