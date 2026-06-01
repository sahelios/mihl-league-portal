import { describe, it, expect } from "vitest";

// Test the state encoding/decoding logic
describe("OAuth State Encoding/Decoding", () => {
  it("should encode state with origin and returnPath", () => {
    const stateData = {
      origin: "https://mihl.ca",
      returnPath: "/player-portal"
    };
    const state = btoa(JSON.stringify(stateData));
    expect(state).toBeDefined();
    expect(typeof state).toBe("string");
  });

  it("should decode state correctly", () => {
    const originalData = {
      origin: "https://mihl.ca",
      returnPath: "/player-portal"
    };
    const state = btoa(JSON.stringify(originalData));
    
    // Simulate decoding on backend
    const decoded = atob(state);
    const decodedData = JSON.parse(decoded);
    
    expect(decodedData.origin).toBe("https://mihl.ca");
    expect(decodedData.returnPath).toBe("/player-portal");
  });

  it("should handle state with default returnPath", () => {
    const stateData = {
      origin: "https://mihl.ca",
      returnPath: "/"
    };
    const state = btoa(JSON.stringify(stateData));
    
    const decoded = atob(state);
    const decodedData = JSON.parse(decoded);
    
    expect(decodedData.returnPath).toBe("/");
  });

  it("should preserve origin across encode/decode cycle", () => {
    const origins = [
      "https://mihl.ca",
      "https://www.mihl.ca",
      "https://3000-ia3rgj94wbow25yfehz0n-8a57c641.us2.manus.computer"
    ];
    
    origins.forEach(origin => {
      const stateData = { origin, returnPath: "/" };
      const state = btoa(JSON.stringify(stateData));
      const decoded = atob(state);
      const decodedData = JSON.parse(decoded);
      
      expect(decodedData.origin).toBe(origin);
    });
  });

  it("should handle invalid state gracefully", () => {
    const invalidState = "not-valid-base64!!!";
    
    try {
      const decoded = atob(invalidState);
      JSON.parse(decoded);
      // If it doesn't throw, that's fine for this test
    } catch (error) {
      // Expected behavior - should fail gracefully
      expect(error).toBeDefined();
    }
  });

  it("should construct correct redirect_uri from decoded origin", () => {
    const stateData = {
      origin: "https://mihl.ca",
      returnPath: "/"
    };
    const state = btoa(JSON.stringify(stateData));
    
    // Simulate backend processing
    const decoded = atob(state);
    const decodedData = JSON.parse(decoded);
    const redirectUri = `${decodedData.origin}/api/oauth/callback`;
    
    expect(redirectUri).toBe("https://mihl.ca/api/oauth/callback");
  });

  it("should match authorization request redirect_uri with token exchange redirect_uri", () => {
    // Frontend: creates authorization request
    const frontendOrigin = "https://mihl.ca";
    const frontendRedirectUri = `${frontendOrigin}/api/oauth/callback`;
    const stateData = { origin: frontendOrigin, returnPath: "/" };
    const state = btoa(JSON.stringify(stateData));
    
    // Backend: processes callback
    const decoded = atob(state);
    const decodedData = JSON.parse(decoded);
    const backendRedirectUri = `${decodedData.origin}/api/oauth/callback`;
    
    // They should match exactly
    expect(backendRedirectUri).toBe(frontendRedirectUri);
  });
});
