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

const COOKIE_NAME = "session";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

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
  }),
  league: leagueRouter,
  registration: registrationRouter,
  admin: adminRouter,
  referee: refereeRouter,
});

export type AppRouter = typeof appRouter;
