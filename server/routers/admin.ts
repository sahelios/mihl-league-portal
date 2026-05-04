import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
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

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0,
    };

    result.forEach((row) => {
      const count = Number(row.count || 0);
      stats.total += count;
      if (row.status === "pending") stats.pending = count;
      if (row.status === "approved") stats.approved = count;
      if (row.status === "rejected") stats.rejected = count;
    });

    return stats;
  }),

  approveRegistration: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await db
        .update(playerRegistrations)
        .set({ status: "approved" })
        .where(eq(playerRegistrations.id, input.id));

      return { success: true, message: "Registration approved" };
    }),

  rejectRegistration: adminProcedure
    .input(z.object({ id: z.number(), reason: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(playerRegistrations)
        .set({ status: "rejected" })
        .where(eq(playerRegistrations.id, input.id));

      return { success: true, message: "Registration rejected" };
    }),

  markPaymentPaid: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await db
        .update(playerRegistrations)
        .set({ paymentStatus: "paid" })
        .where(eq(playerRegistrations.id, input.id));

      return { success: true, message: "Payment marked as paid" };
    }),

  // ============ GAME MANAGEMENT ============
  getUpcomingGames: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select({
        id: games.id,
        teamAName: sql`COALESCE((SELECT name FROM teams WHERE id = ${games.homeTeamId}), 'Team A')`,
        teamBName: sql`COALESCE((SELECT name FROM teams WHERE id = ${games.awayTeamId}), 'Team B')`,
        date: games.gameDate,
        time: games.gameTime,
        status: games.status,
      })
      .from(games)
      .where(eq(games.status, "scheduled"))
      .orderBy(games.gameDate);

    return result;
  }),

  getRecentGames: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select({
        id: games.id,
        teamAName: sql`COALESCE((SELECT name FROM teams WHERE id = ${games.homeTeamId}), 'Team A')`,
        teamBName: sql`COALESCE((SELECT name FROM teams WHERE id = ${games.awayTeamId}), 'Team B')`,
        date: games.gameDate,
        teamAScore: games.homeScore,
        teamBScore: games.awayScore,
        status: games.status,
      })
      .from(games)
      .where(eq(games.status, "completed"))
      .orderBy(sql`${games.gameDate} DESC`)
      .limit(10);

    return result;
  }),

  submitGameScore: adminProcedure
    .input(
      z.object({
        gameId: z.number(),
        teamAScore: z.number().min(0),
        teamBScore: z.number().min(0),
        scorers: z.string().optional(),
        assists: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(games)
        .set({
          homeScore: input.teamAScore,
          awayScore: input.teamBScore,
          status: "completed",
        })
        .where(eq(games.id, input.gameId));

      return { success: true, message: "Score submitted successfully" };
    }),

  // ============ NEWS MANAGEMENT ============
  getNewsPosts: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select()
      .from(newsPosts)
      .orderBy(sql`${newsPosts.createdAt} DESC`);

    return result.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      published: post.isApproved,
      createdAt: post.createdAt,
    }));
  }),

  createNewsPost: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        imageUrl: z.string().optional(),
        published: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await db.insert(newsPosts).values({
        title: input.title,
        content: input.content,
        imageUrl: input.imageUrl || null,
        isApproved: input.published,
        seasonId: 1,
      });

      return { success: true, message: "Post created" };
    }),

  updateNewsPost: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1),
        content: z.string().min(1),
        imageUrl: z.string().optional(),
        published: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(newsPosts)
        .set({
          title: input.title,
          content: input.content,
          imageUrl: input.imageUrl || null,
          isApproved: input.published,
        })
        .where(eq(newsPosts.id, input.id));

      return { success: true, message: "Post updated" };
    }),

  deleteNewsPost: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(newsPosts).where(eq(newsPosts.id, input.id));

      return { success: true, message: "Post deleted" };
    }),

  // ============ STARS OF THE WEEK ============
  getCurrentStars: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select({
        id: starsOfWeek.playerTeamId,
        firstName: sql`SUBSTRING_INDEX(${starsOfWeek.playerName}, ' ', 1)`,
        lastName: sql`SUBSTRING_INDEX(${starsOfWeek.playerName}, ' ', -1)`,
        position: sql`'forward'`,
        playerRating: starsOfWeek.rating,
      })
      .from(starsOfWeek)
      .limit(3);

    return result;
  }),

  getApprovedPlayers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select({
        id: playerRegistrations.id,
        firstName: playerRegistrations.firstName,
        lastName: playerRegistrations.lastName,
        position: playerRegistrations.position,
        playerRating: playerRegistrations.playerRating,
      })
      .from(playerRegistrations)
      .where(eq(playerRegistrations.status, "approved")) as any;

    return result;
  }),

  selectStars: adminProcedure
    .input(z.object({ playerIds: z.array(z.number()).min(1).max(3) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Clear existing stars
      await db.delete(starsOfWeek);

      // Insert new stars
      for (const playerId of input.playerIds) {
        await db.insert(starsOfWeek).values({
          playerTeamId: playerId,
          playerName: "Player",
          seasonId: 1,
          weekNumber: 1,
        });
      }

      return { success: true, message: "Stars updated" };
    }),

  // ============ SUSPENSION MANAGEMENT ============
  getActiveSuspensions: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select({
        id: suspensions.id,
        playerId: suspensions.playerTeamId,
        playerName: suspensions.playerName,
        reason: suspensions.reason,
        startDate: suspensions.startDate,
        gamesRemaining: sql`0`,
      })
      .from(suspensions)
      .where(eq(suspensions.isActive, true));

    return result;
  }),

  addSuspension: adminProcedure
    .input(
      z.object({
        playerId: z.number(),
        reason: z.string().min(1),
        duration: z.number().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + input.duration * 7 * 24 * 60 * 60 * 1000);
      
      await db.insert(suspensions).values({
        playerTeamId: input.playerId,
        playerName: "Player",
        reason: input.reason,
        startDate: startDate,
        endDate: endDate,
        isActive: true,
        seasonId: 1,
      });

      return { success: true, message: "Suspension added" };
    }),

  removeSuspension: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(suspensions)
        .set({ isActive: false })
        .where(eq(suspensions.id, input.id));

      return { success: true, message: "Suspension removed" };
    }),

  // ============ MESSAGING ============
  getTeams: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db.select({ id: teams.id, name: teams.name }).from(teams);

    return result.map(t => ({ id: t.id, name: t.name || "" })) as any;
  }),

  getPlayers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select({
        id: playerRegistrations.id,
        firstName: playerRegistrations.firstName,
        lastName: playerRegistrations.lastName,
      })
      .from(playerRegistrations)
      .where(eq(playerRegistrations.status, "approved")) as any;

    return result;
  }),

  sendMessage: adminProcedure
    .input(
      z.object({
        type: z.enum(["all", "team", "player"]),
        targetId: z.number().optional(),
        content: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ input }) => {
      // For now, just log the message
      console.log(`[MESSAGE] Type: ${input.type}, Target: ${input.targetId}, Content: ${input.content}`);

      return { success: true, message: "Message sent" };
    }),

  getMessageHistory: adminProcedure.query(async () => {
    // Return empty array for now
    return [];
  }),

  // ============ SETTINGS MANAGEMENT ============
  getSeasons: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db.select().from(seasons);

    return result;
  }),

  createSeason: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const startDateObj = new Date(input.startDate);
      const endDateObj = new Date(input.endDate);
      
      // Convert to date only (YYYY-MM-DD)
      const startDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
      const endDate = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
      
      await db.insert(seasons).values({
        name: input.name,
        startDate: startDate,
        endDate: endDate,
        isActive: false,
      });

      return { success: true, message: "Season created" };
    }),

  updateSeason: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const startDateObj = new Date(input.startDate);
      const endDateObj = new Date(input.endDate);
      
      // Convert to date only (YYYY-MM-DD)
      const startDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
      const endDate = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
      
      await db
        .update(seasons)
        .set({
          name: input.name,
          startDate: startDate,
          endDate: endDate,
        })
        .where(eq(seasons.id, input.id));

      return { success: true, message: "Season updated" };
    }),

  deleteSeason: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(seasons).where(eq(seasons.id, input.id));

      return { success: true, message: "Season deleted" };
    }),

  // ============ TEAM MANAGEMENT ============
  getTeamsForSettings: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db.select().from(teams);

    return result.map((team) => {
      const colors = team.colors || "#1a1f3a,#c0c5d0";
      const [primary, secondary] = colors.split(",");
      return {
        id: team.id,
        name: team.name || "",
        logoUrl: team.logoUrl,
        primaryColor: primary.trim(),
        secondaryColor: secondary.trim(),
        wins: 0,
        losses: 0,
        points: 0,
      };
    });
  }),

  createTeam: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(teams).values({
        name: input.name,
        logoUrl: input.logoUrl || null,
        colors: `${input.primaryColor || "#1a1f3a"},${input.secondaryColor || "#c0c5d0"}`,
        seasonId: 1,
      } as any);

      return { success: true, message: "Team created" };
    }),

  updateTeam: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(teams)
        .set({
          name: input.name,
          logoUrl: input.logoUrl || null,
          colors: `${input.primaryColor || "#1a1f3a"},${input.secondaryColor || "#c0c5d0"}`,
        } as any)
        .where(eq(teams.id, input.id));

      return { success: true, message: "Team updated" };
    }),

  deleteTeam: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(teams).where(eq(teams.id, input.id));

      return { success: true, message: "Team deleted" };
    }),

  // ============ VENUE MANAGEMENT ============
  getVenues: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db.select().from(gameVenues);

    return result.map((venue) => ({
      id: venue.id,
      name: venue.name || "",
      address: venue.address || "",
      city: "",
      capacity: 0,
      scheduledGamesCount: 0,
    }));
  }),

  createVenue: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().min(1),
        city: z.string().min(1),
        capacity: z.number().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(gameVenues).values({
        name: input.name,
        address: input.address,
      } as any);

      return { success: true, message: "Venue created" };
    }),

  updateVenue: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
        address: z.string().min(1),
        city: z.string().min(1),
        capacity: z.number().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(gameVenues)
        .set({
          name: input.name,
          address: input.address,
        } as any)
        .where(eq(gameVenues.id, input.id));

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
});
