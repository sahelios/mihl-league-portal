import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { leagueRouter } from "./routers/league";
import { registrationRouter } from "./routers/registration";
import { adminRouter } from "./routers/admin";
import { refereeRouter } from "./routers/referee";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { validateLoginToken, markTokenAsUsed } from "./_core/adminRegistrationService";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    signup: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Check if email already exists
          const existingUser = await db.getUserByEmail(input.email);
          if (existingUser) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Email already registered',
            });
          }

          // Hash password
          const passwordHash = await bcrypt.hash(input.password, 10);

          // Create user
          const user = await db.createUser({
            email: input.email,
            passwordHash,
            name: input.name || null,
            loginMethod: 'email',
            emailVerified: true,
          });

          // Create session token
          const sessionToken = await ctx.sdk.createSessionToken(user.id.toString(), {
            name: user.name || '',
            expiresInMs: ONE_YEAR_MS,
          });

          // Set session cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Signup failed',
          });
        }
      }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Find user by email
          const user = await db.getUserByEmail(input.email);
          if (!user || !user.passwordHash) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid email or password',
            });
          }

          // Verify password
          const isValid = await bcrypt.compare(input.password, user.passwordHash);
          if (!isValid) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid email or password',
            });
          }

          // Create session token
          const sessionToken = await ctx.sdk.createSessionToken(user.id.toString(), {
            name: user.name || '',
            expiresInMs: ONE_YEAR_MS,
          });

          // Set session cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Login failed',
          });
        }
      }),
    validateMagicLink: publicProcedure
      .input(z.object({
        token: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          const registrationId = await validateLoginToken(input.token);
          if (!registrationId) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid or expired magic link',
            });
          }

          return {
            valid: true,
            registrationId,
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Link validation failed',
          });
        }
      }),
    loginWithMagicLink: publicProcedure
      .input(z.object({
        token: z.string(),
        password: z.string().min(6),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Validate magic link token
          const registrationId = await validateLoginToken(input.token);
          if (!registrationId) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid or expired magic link',
            });
          }

          // Get player registration to get email
          const registration = await db.getPlayerRegistration(registrationId);
          if (!registration) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Player registration not found',
            });
          }

          // Check if user already exists
          let user = await db.getUserByEmail(registration.email);
          if (!user) {
            // Create new user with email from registration
            const passwordHash = await bcrypt.hash(input.password, 10);
            user = await db.createUser({
              email: registration.email,
              passwordHash,
              name: input.name || `${registration.firstName} ${registration.lastName}`,
              loginMethod: 'magic-link',
              emailVerified: true,
            });
          } else if (!user.passwordHash) {
            // User exists but has no password, set it now
            const passwordHash = await bcrypt.hash(input.password, 10);
            user = await db.updateUserPassword(user.id, passwordHash);
          }

          // Mark token as used
          await markTokenAsUsed(input.token);

          // Create session token
          const sessionToken = await ctx.sdk.createSessionToken(user.id.toString(), {
            name: user.name || '',
            expiresInMs: ONE_YEAR_MS,
          });

          // Set session cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          return {
            success: true,
            registrationId,
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Magic link login failed',
          });
        }
      }),
  }),
  league: leagueRouter,
  registration: registrationRouter,
  admin: adminRouter,
  referee: refereeRouter,
});

export type AppRouter = typeof appRouter;
