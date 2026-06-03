import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export type GoogleSessionPayload = {
  sub: string; // Google's unique user ID
  email: string;
  name: string;
};

class GoogleOAuthService {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = ENV.googleClientId;
    this.clientSecret = ENV.googleClientSecret;

    console.log("[Google OAuth] Initializing with:", {
      clientIdLength: this.clientId?.length,
      clientSecretLength: this.clientSecret?.length,
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
    });

    if (!this.clientId || !this.clientSecret) {
      console.error(
        "[Google OAuth] ERROR: GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET is not configured!"
      );
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; idToken?: string }> {
    try {
      console.log("[Google OAuth] Exchanging code for token with:", {
        clientId: this.clientId,
        redirectUri,
        codeLength: code.length,
      });
      
      const response = await axios.post(GOOGLE_TOKEN_URL, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      });

      return {
        accessToken: response.data.access_token,
        idToken: response.data.id_token,
      };
    } catch (error: any) {
      console.error("[Google OAuth] Token exchange failed:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        requestData: {
          client_id: this.clientId?.substring(0, 10) + '...',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_length: code.length,
        }
      });
      throw new Error("Failed to exchange code for token");
    }
  }

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
    picture?: string;
  }> {
    try {
      const response = await axios.get(GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("[Google OAuth] getUserInfo response:", JSON.stringify(response.data));
      console.log("[Google OAuth] getUserInfo parsed:", {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        picture: response.data.picture,
      });

      return {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        picture: response.data.picture,
      };
    } catch (error) {
      console.error("[Google OAuth] Get user info failed:", error);
      throw new Error("Failed to get user information");
    }
  }

  /**
   * Generate Google OAuth login URL
   */
  getLoginUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
}

class GoogleOAuthSDK {
  private oauthService: GoogleOAuthService;

  constructor() {
    this.oauthService = new GoogleOAuthService();
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  /**
   * Exchange Google authorization code for session
   */
  async exchangeCodeForSession(
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; userInfo: { id: string; email: string; name: string } }> {
    const tokens = await this.oauthService.exchangeCodeForToken(code, redirectUri);
    const userInfo = await this.oauthService.getUserInfo(tokens.accessToken);

    return {
      accessToken: tokens.accessToken,
      userInfo,
    };
  }

  /**
   * Create a session token for a Google user
   */
  async createSessionToken(
    googleId: string,
    email: string,
    name: string,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const payload = {
      sub: googleId,
      email,
      name,
    };
    console.log("[Google OAuth SDK] createSessionToken called with payload:", payload);
    return this.signSession(payload, options);
  }

  async signSession(
    payload: GoogleSessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();
    
    const jwtPayload = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
    };
    console.log("[Google OAuth SDK] signSession creating JWT with payload:", jwtPayload);

    return new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  /**
   * Verify session token
   */
  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<GoogleSessionPayload | null> {
    if (!cookieValue) {
      console.warn("[Google Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });

      const { sub, email, name } = payload as Record<string, unknown>;
      
      console.log("[Google Auth] JWT verification successful!");
      console.log("[Google Auth] Payload keys:", Object.keys(payload));
      console.log("[Google Auth] Field types - sub:", typeof sub, "email:", typeof email, "name:", typeof name);
      console.log("[Google Auth] Field values - sub:", sub, "email:", email, "name:", name);

      if (typeof sub !== "string" || typeof email !== "string" || typeof name !== "string") {
        console.warn("[Google Auth] Session payload missing required fields");
        console.warn("[Google Auth] Expected all strings, got:", { sub: typeof sub, email: typeof email, name: typeof name });
        return null;
      }

      return { sub, email, name };
    } catch (error) {
      console.warn("[Google Auth] Session verification failed", String(error));
      console.warn("[Google Auth] Error details:", error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Authenticate request and return user
   * Preserves existing user accounts by email mapping
   */
  async authenticateRequest(req: Request): Promise<User> {
    console.log("[Auth] authenticateRequest called");
    console.log("[Auth] req.headers.cookie:", req.headers.cookie ? `present (${req.headers.cookie.length} chars)` : "MISSING");
    console.log("[Auth] req.cookies:", (req as any).cookies ? "present" : "MISSING");
    
    const cookies = this.parseCookies(req.headers.cookie);
    console.log("[Auth] Parsed cookies count:", cookies.size);
    console.log("[Auth] Cookie names:", Array.from(cookies.keys()));
    
    const sessionCookie = cookies.get(COOKIE_NAME);
    console.log("[Auth] Session cookie found:", sessionCookie ? `yes (${sessionCookie.length} chars)` : "NO");
    
    const session = await this.verifySession(sessionCookie);
    console.log("[Auth] Session verified:", session ? `yes (${session.email})` : "NO");

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const signedInAt = new Date();

    // Try to find user by email first (preserve existing accounts)
    let user = await db.getUserByEmail(session.email);

    // If not found by email, create new user with Google ID as openId
    if (!user) {
      await db.upsertUser({
        openId: session.sub,
        email: session.email,
        name: session.name,
        loginMethod: "google",
        lastSignedIn: signedInAt,
      });
      user = await db.getUserByOpenId(session.sub);
    } else {
      // Update existing user with Google ID if not already set
      if (!user.openId || user.openId !== session.sub) {
        await db.upsertUser({
          openId: session.sub,
          email: session.email,
          name: session.name,
          loginMethod: "google",
          lastSignedIn: signedInAt,
        });
      } else {
        // Just update last signed in
        await db.upsertUser({
          openId: session.sub,
          lastSignedIn: signedInAt,
        });
      }
      user = await db.getUserByEmail(session.email);
    }

    if (!user) {
      throw ForbiddenError("User not found");
    }

    return user;
  }

  /**
   * Generate login URL for Google OAuth
   */
  getLoginUrl(returnPath: string = "/"): string {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectUri = `${origin}/api/oauth/callback`;
    // Use a simple state value - Google will pass it back unchanged
    const state = "oauth_state_123";

    return this.oauthService.getLoginUrl(redirectUri, state);
  }
}

export const googleOAuthSDK = new GoogleOAuthSDK();
