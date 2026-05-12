import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { z } from "zod";
import { eq, and, sql, or } from "drizzle-orm";
import {
  playerRegistrations,
  games,
  newsPosts,
  blogPosts,
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
    .input(z.object({ name: z.string().min(1), address: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(gameVenues).values({ name: input.name, address: input.address });
      return { success: true, message: "Venue created" };
    }),

  updateVenue: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1), address: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(gameVenues).set({ name: input.name, address: input.address }).where(eq(gameVenues.id, input.id));
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
    .input(z.object({ gameId: z.number(), homeScore: z.number(), awayScore: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(games).set({ homeScore: input.homeScore, awayScore: input.awayScore, status: 'completed' }).where(eq(games.id, input.gameId));
      return { success: true };
    }),

  getUpcomingGames: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return await db.select().from(games).where(eq(games.status, 'scheduled'));
  }),

  getRecentGames: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return await db.select().from(games).where(eq(games.status, 'completed'));
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

      await db.update(playerRegistrations).set({ status: 'approved', paymentAmount: input.paymentAmount.toString() }).where(eq(playerRegistrations.id, input.id));
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

  // ============ NEWS MANAGEMENT ============
  getNewsPosts: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db.select().from(newsPosts).orderBy(sql`${newsPosts.createdAt} DESC`);
    
    return result.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      author: "Admin",
      createdAt: post.createdAt.toISOString().split('T')[0]
    }));
  }),

  createNewsPost: adminProcedure
    .input(z.object({ title: z.string().min(1), content: z.string().min(1), imageUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(newsPosts).values({ title: input.title, content: input.content, imageUrl: input.imageUrl || null });
      return { success: true };
    }),

  updateNewsPost: adminProcedure
    .input(z.object({ id: z.number(), title: z.string().min(1), content: z.string().min(1), imageUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(newsPosts).set({ title: input.title, content: input.content, imageUrl: input.imageUrl || null }).where(eq(newsPosts.id, input.id));
      return { success: true };
    }),

  deleteNewsPost: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(newsPosts).where(eq(newsPosts.id, input.id));
      return { success: true };
    }),

  // ============ BLOG MANAGEMENT ============
  getBlogPosts: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db.select().from(blogPosts).orderBy(sql`${blogPosts.createdAt} DESC`);
    
    return result.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      author: "Admin",
      createdAt: post.createdAt.toISOString().split('T')[0]
    }));
  }),

  createBlogPost: adminProcedure
    .input(z.object({ title: z.string().min(1), content: z.string().min(1), imageUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(blogPosts).values({ title: input.title, content: input.content, imageUrl: input.imageUrl || null });
      return { success: true };
    }),

  updateBlogPost: adminProcedure
    .input(z.object({ id: z.number(), title: z.string().min(1), content: z.string().min(1), imageUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(blogPosts).set({ title: input.title, content: input.content, imageUrl: input.imageUrl || null }).where(eq(blogPosts.id, input.id));
      return { success: true };
    }),

  deleteBlogPost: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
      return { success: true };
    }),

  // ============ STARS OF THE WEEK ============
  getStarsOfWeek: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return await db.select().from(starsOfWeek).orderBy(sql`${starsOfWeek.weekNumber} DESC`);
  }),

  selectStarOfWeek: adminProcedure
    .input(z.object({ weekNumber: z.number(), playerName: z.string(), teamId: z.number(), rating: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(starsOfWeek).values({
        playerName: input.playerName,
        teamId: input.teamId,
        weekNumber: input.weekNumber,
        rating: input.rating,
      });
      return { success: true };
    }),

  // ============ SUSPENSIONS ============
  getActiveSuspensions: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    try {
      const allSuspensions = await db.select().from(suspensions);
      const completedGames = await db.select().from(games).where(eq(games.status, 'completed'));
      
      return allSuspensions.map(suspension => {
        const gamesAfterStart = completedGames.filter(g => {
          const gameDate = new Date(g.gameDate);
          const suspensionStart = new Date(suspension.startDate);
          return gameDate >= suspensionStart;
        }).length;
        
        const nextEligibleGameNumber = gamesAfterStart + 1;
        const nextEligibleGame = completedGames.length > 0 
          ? `After game ${nextEligibleGameNumber}`
          : null;
        
        return {
          ...suspension,
          gamesRemaining: Math.max(0, nextEligibleGameNumber - gamesAfterStart),
          nextEligibleGame,
          teamName: suspension.teamId ? `Team ${suspension.teamId}` : undefined,
        };
      }).filter(s => s.isActive);
    } catch (error) {
      console.error('Error fetching suspensions:', error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch suspensions" });
    }
  }),

  addSuspension: adminProcedure
    .input(z.object({ playerName: z.string(), reason: z.string(), startDate: z.string(), teamId: z.number().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(suspensions).values({
        playerName: input.playerName,
        reason: input.reason,
        startDate: new Date(input.startDate),
        teamId: input.teamId || null,
        isActive: true,
      });
      return { success: true };
    }),

   removeSuspension: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(suspensions).set({ isActive: false }).where(eq(suspensions.id, input.id));
      return { success: true };
    }),

  getVenues: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return await db.select().from(gameVenues);
  }),

  createGames: adminProcedure
    .input(z.object({
      games: z.array(z.object({
        homeTeamId: z.number(),
        awayTeamId: z.number(),
        venueId: z.number(),
        gameDate: z.string(),
        gameTime: z.string(),
      }))
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        const seasons_data = await db.select().from(seasons).where(eq(seasons.isActive, true));
        if (seasons_data.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No active season found" });
        }
        const seasonId = seasons_data[0].id;

        const gamesToInsert = input.games.map(game => ({
          seasonId,
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId,
          venueId: game.venueId,
          gameDate: new Date(game.gameDate),
          gameTime: game.gameTime,
          status: "scheduled" as const,
        }));

        await db.insert(games).values(gamesToInsert);
        return { success: true, message: `Created ${gamesToInsert.length} games` };
      } catch (error: any) {
        console.error('Error creating games:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "Failed to create games" });
      }
    }),
});
