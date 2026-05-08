import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { z } from "zod";
import { eq, and, sql, or } from "drizzle-orm";
import {
  playerRegistrations,
  games,
  newsPosts,
  starsOfWeek,
  suspensions,
  teams,
  seasons,
  gameVenues,
} from "../../drizzle/schema";

// Helper to ensure admin access
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ============ REGISTRATION MANAGEMENT ============
  getRegistrationStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select({
        status: playerRegistrations.status,
        count: sql<number>`count(*)`,
      })
      .from(playerRegistrations)
      .groupBy(playerRegistrations.status);

    const stats = { pending: 0, approved: 0, rejected: 0, total: 0 };

    result.forEach((row) => {
      const count = Number(row.count || 0);
      stats.total += count;
      if (row.status === "pending") stats.pending = count;
      if (row.status === "approved") stats.approved = count;
      if (row.status === "rejected") stats.rejected = count;
    });

    return stats;
  }),

  getEvaluationAttendance: adminProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const results = await db
        .select()
        .from(playerRegistrations)
        .where(eq(playerRegistrations.evaluationDate, input.date));

      return results;
    }),

  // ============ SETTINGS: VENUES ============
  createVenue: adminProcedure
    .input(z.object({ name: z.string().min(1), address: z.string().min(1), city: z.string().min(1), capacity: z.number().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(gameVenues).values({ name: input.name, address: input.address, city: input.city, capacity: input.capacity } as any);
      return { success: true, message: "Venue created" };
    }),

  updateVenue: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1), address: z.string().min(1), city: z.string().min(1), capacity: z.number().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(gameVenues).set({ name: input.name, address: input.address, city: input.city, capacity: input.capacity } as any).where(eq(gameVenues.id, input.id));
      return { success: true, message: "Venue updated" };
    }),

  deleteVenue: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(gameVenues).where(eq(gameVenues.id, input.id));
      return { success: true, message: "Venue deleted" };
    }),

  // ============ GAME MANAGEMENT ============
  submitGameScore: adminProcedure
    .input(z.object({ gameId: z.number(), teamAScore: z.number(), teamBScore: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(games).set({ teamAScore: input.teamAScore, teamBScore: input.teamBScore, status: 'completed' } as any).where(eq(games.id, input.gameId));
      return { success: true };
    }),

  getUpcomingGames: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return await db.select().from(games).where(eq(games.status as any, 'scheduled'));
  }),

  getRecentGames: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return await db.select().from(games).where(eq(games.status as any, 'completed'));
  }),

  // ============ REFEREE APPLICATIONS ============
  getPendingRefereeApplications: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const results = await db.select().from(playerRegistrations)
      .where(and(
        or(eq(playerRegistrations.registrationType, 'referee'), eq(playerRegistrations.registrationType, 'scorekeeper')),
        eq(playerRegistrations.status, 'pending')
      ));

    return results.map(app => ({
      id: app.id,
      firstName: app.firstName,
      lastName: app.lastName,
      email: app.email,
      phone: app.phone,
      role: app.registrationType,
      interacEmail: app.email,
      yearsOfExperience: app.playerRating || 0,
      hockeyLevels: ["Adult League"],
    }));
  }),

  approveRefereeApplication: adminProcedure
    .input(z.object({ id: z.number(), paymentAmount: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(playerRegistrations).set({ status: 'approved', paymentAmount: input.paymentAmount.toString() } as any).where(eq(playerRegistrations.id, input.id));
      return { success: true };
    }),

  rejectRefereeApplication: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(playerRegistrations).set({ status: 'rejected' }).where(eq(playerRegistrations.id, input.id));
      return { success: true };
    }),

  // ============ BLOG / NEWS MANAGEMENT ============
  getBlogPosts: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Using newsPosts as the schema for both blog/news
    const result = await db.select().from(newsPosts).orderBy(sql`${newsPosts.createdAt} DESC`);
    
    return result.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      author: "Admin",
      category: "news",
      published: post.published,
      publishDate: post.createdAt.toISOString().split('T')[0]
    }));
  }),

  createBlogPost: adminProcedure
    .input(z.object({ title: z.string().min(1), content: z.string().min(1), author: z.string().optional(), imageUrl: z.string().optional(), category: z.string().optional(), published: z.boolean().optional(), publishDate: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(newsPosts).values({ title: input.title, content: input.content, imageUrl: input.imageUrl || null, published: input.published || true } as any);
      return { success: true };
    }),

  updateBlogPost: adminProcedure
    .input(z.object({ id: z.number(), title: z.string().min(1), content: z.string().min(1), imageUrl: z.string().optional(), published: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(newsPosts).set({ title: input.title, content: input.content, imageUrl: input.imageUrl || null, published: input.published } as any).where(eq(newsPosts.id, input.id));
      return { success: true };
    }),

  deleteBlogPost: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(newsPosts).where(eq(newsPosts.id, input.id));
      return { success: true };
    }),
});