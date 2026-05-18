import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { z } from "zod";
import { eq, and, sql, or, inArray, desc } from "drizzle-orm";
import {
  playerRegistrations,
  games,
  newsPosts,
  blogPosts,
  starsOfWeek,
  suspensions,
  teams,
  masterTeams,
  seasons,
  gameVenues,
  refereeApplications,
  staffGameAssignments,
  staffPayments,
  notifications,
  waitingList,
  evaluationGameAssignments,
  playerTeams,
  playerStats,
  gameStats,
  badges,
  teamMessages,
  adminMessages,
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
    .input(z.object({}).strict())
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get all evaluation games from the active season
      const activeSeason = await db
        .select()
        .from(seasons)
        .where(eq(seasons.isActive, true))
        .limit(1);

      if (!activeSeason.length) {
        return [];
      }

      const evalGames = await db
        .selectDistinct({ gameDate: games.gameDate })
        .from(games)
        .where(and(
          eq(games.seasonId, activeSeason[0].id),
          eq(games.homeTeamId, 1),
          eq(games.awayTeamId, 2)
        ))
        .orderBy(games.gameDate);

      // For each evaluation game date, get all players registered for that date
      const results = await Promise.all(
        evalGames.map(async (game) => {
          const dateStr = game.gameDate.toISOString().split('T')[0];
          const attendees = await db
            .select()
            .from(playerRegistrations)
            .where(eq(playerRegistrations.evaluationDate, dateStr));
          
          return {
            date: dateStr,
            attendees: attendees
          };
        })
      );

      return results;
    }),

  addToEvaluationGame: adminProcedure
    .input(z.object({ registrationId: z.number(), evaluationDate: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(playerRegistrations)
        .set({ evaluationDate: input.evaluationDate })
        .where(eq(playerRegistrations.id, input.registrationId));

      return { success: true, message: "Player added to evaluation game" };
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
      yearsOfExperience: 0,
      hockeyLevels: ["Adult League"],
    }));
  }),

  approveRefereeApplication: adminProcedure
    .input(z.object({ id: z.number(), paymentAmount: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(playerRegistrations).set({ status: 'approved' }).where(eq(playerRegistrations.id, input.id));
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
        seasonId: z.number(),
      }))
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // Verify season exists
        if (input.games.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No games provided" });
        }
        
        const seasonId = input.games[0].seasonId;
        const seasonData = await db.select().from(seasons).where(eq(seasons.id, seasonId));
        if (seasonData.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Season not found" });
        }

        const gamesToInsert = input.games.map(game => ({
          seasonId: game.seasonId,
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

  // ============ SEASON MANAGEMENT ============
  getSeasons: adminProcedure
    .input(z.void().optional())
    .query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const result = await db.select().from(seasons).orderBy(seasons.startDate);
    return result.map(season => ({
      ...season,
      startDate: season.startDate instanceof Date ? season.startDate.toISOString().split('T')[0] : season.startDate,
      endDate: season.endDate instanceof Date ? season.endDate.toISOString().split('T')[0] : season.endDate,
      createdAt: season.createdAt instanceof Date ? season.createdAt.toISOString() : season.createdAt,
    }));
  }),

  createSeason: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      startDate: z.string(),
      endDate: z.string(),
      registrationDeadline: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // Insert the season
        const result = await db.insert(seasons).values({
          name: input.name,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          // registrationDeadline removed - column doesn't exist in database
          isActive: false,
        });
        
        // Get the newly created season - fetch the latest season
        const createdSeasons = await db.select().from(seasons).orderBy(desc(seasons.id)).limit(1);
        if (createdSeasons.length === 0) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve created season" });
        }
        const newSeasonId = createdSeasons[0].id;
        
        // Get all master teams
        const allMasterTeams = await db.select().from(masterTeams);
        
        // Create team instances for each master team in this season
        const teamInstances = allMasterTeams.map(masterTeam => ({
          masterTeamId: masterTeam.id,
          seasonId: newSeasonId,
        }));
        
        if (teamInstances.length > 0) {
          await db.insert(teams).values(teamInstances);
        }
        
        return { success: true, message: `Season created successfully with ${teamInstances.length} teams` };
      } catch (error: any) {
        console.error('Error creating season:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "Failed to create season" });
      }
    }),

  // ============ TEAM MANAGEMENT ============
  getTeams: adminProcedure
    .input(z.object({ seasonId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      try {
        const baseQuery = db
          .select({
            id: teams.id,
            name: masterTeams.name,
            seasonId: teams.seasonId,
            masterTeamId: teams.masterTeamId,
            createdAt: teams.createdAt,
          })
          .from(teams)
          .leftJoin(masterTeams, eq(teams.masterTeamId, masterTeams.id));
        
        if (input?.seasonId) {
          return await baseQuery.where(eq(teams.seasonId, input.seasonId));
        }
        return await baseQuery;
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  getPlayerTeams: adminProcedure
    .input(z.object({}).strict())
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      try {
        const result = await db
          .select()
          .from(playerTeams);
        return result;
      } catch (error: any) {
        console.error('Error fetching player teams:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  createTeam: adminProcedure
    .input(z.object({
      masterTeamId: z.number(),
      seasonId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        await db.insert(teams).values({
          masterTeamId: input.masterTeamId,
          seasonId: input.seasonId,
        });
        return { success: true, message: "Team created successfully" };
      } catch (error: any) {
        console.error('Error creating team:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "Failed to create team" });
      }
    }),

  updateTeam: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // Team names are now stored in masterTeams table
        // To update a team name, update the masterTeams table instead
        throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Update masterTeam name instead" });
      } catch (error: any) {
        console.error('Error updating team:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "Failed to update team" });
      }
    }),

  updateSeason: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        await db.update(seasons).set({
          name: input.name,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
        }).where(eq(seasons.id, input.id));
        return { success: true, message: "Season updated successfully" };
      } catch (error: any) {
        console.error('Error updating season:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "Failed to update season" });
      }
    }),

  deleteSeason: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        await db.delete(seasons).where(eq(seasons.id, input.id));
        return { success: true, message: "Season deleted successfully" };
      } catch (error: any) {
        console.error('Error deleting season:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "Failed to delete season" });
      }
    }),

  // ============ STAFF APPLICATIONS ============
  getAllStaffApplications: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return await db.select().from(refereeApplications).orderBy(refereeApplications.createdAt);
  }),

  approveStaffApplication: adminProcedure
    .input(z.object({
      id: z.number(),
      paymentAmount: z.number().positive(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      try {
        await db.update(refereeApplications)
          .set({
            status: "approved",
            paymentAmount: input.paymentAmount.toString(),
            approvalDate: new Date(),
          })
          .where(eq(refereeApplications.id, input.id));
        return { success: true, message: "Staff application approved" };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  rejectStaffApplication: adminProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      try {
        await db.update(refereeApplications)
          .set({ status: "rejected" })
          .where(eq(refereeApplications.id, input.id));
        return { success: true, message: "Staff application rejected" };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  // ============ STAFF GAME ASSIGNMENTS ============
  assignStaffToGame: adminProcedure
    .input(z.object({
      refereeApplicationId: z.number(),
      gameId: z.number(),
      role: z.enum(["referee", "scorekeeper"]),
      paymentAmount: z.number().positive(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      try {
        await db.insert(staffGameAssignments).values({
          refereeApplicationId: input.refereeApplicationId,
          gameId: input.gameId,
          role: input.role,
          paymentAmount: input.paymentAmount.toString(),
          status: "assigned",
        });
        // Create payment record
        await db.insert(staffPayments).values({
          refereeApplicationId: input.refereeApplicationId,
          gameId: input.gameId,
          amount: input.paymentAmount.toString(),
          status: "pending",
        });
        return { success: true, message: "Staff assigned to game" };
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  deleteTeam: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      try {
        await db.delete(teams).where(eq(teams.id, input.id));
        return { success: true, message: "Team deleted successfully" };
      } catch (error: any) {
        console.error('Error deleting team:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "Failed to delete team" });
      }
    }),

  copyTeam: adminProcedure
    .input(z.object({
      teamId: z.number(),
      newSeasonId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      try {
        const sourceTeam = await db.select().from(teams).where(eq(teams.id, input.teamId)).limit(1);
        if (!sourceTeam.length) throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
        
        await db.insert(teams).values({
          masterTeamId: sourceTeam[0].masterTeamId,
          seasonId: input.newSeasonId,
        });
        return { success: true, message: "Team copied successfully" };
      } catch (error: any) {
        console.error('Error copying team:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "Failed to copy team" });
      }
    }),

  // ============ WAITING LIST MANAGEMENT ============
  getWaitingList: adminProcedure
    .input(z.object({ seasonId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      try {
        const list = await db
          .select({
            id: waitingList.id,
            registrationId: waitingList.registrationId,
            position: waitingList.position,
            status: waitingList.status,
            firstName: playerRegistrations.firstName,
            lastName: playerRegistrations.lastName,
            email: playerRegistrations.email,
            createdAt: waitingList.createdAt,
          })
          .from(waitingList)
          .innerJoin(playerRegistrations, eq(waitingList.registrationId, playerRegistrations.id))
          .where(and(
            eq(waitingList.seasonId, input.seasonId),
            eq(waitingList.status, "waiting")
          ))
          .orderBy(waitingList.position);
        return list;
      } catch (error: any) {
        console.error('Error getting waiting list:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  promoteFromWaitingList: adminProcedure
    .input(z.object({ waitingListId: z.number(), seasonId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      try {
        const entry = await db.select().from(waitingList).where(eq(waitingList.id, input.waitingListId)).limit(1);
        if (!entry.length) throw new TRPCError({ code: "NOT_FOUND", message: "Waiting list entry not found" });

        await db.update(waitingList)
          .set({ status: "promoted", promotedDate: new Date() })
          .where(eq(waitingList.id, input.waitingListId));

        await db.update(playerRegistrations)
          .set({ waitingListStatus: "promoted_from_waiting_list" })
          .where(eq(playerRegistrations.id, entry[0].registrationId));

        await db.insert(notifications).values({
          recipientId: entry[0].registrationId,
          recipientType: "player",
          type: "approval",
          title: "Promoted from Waiting List",
          message: "Congratulations! You have been promoted from the waiting list.",
          relatedId: input.seasonId,
          emailSent: false,
        });

        return { success: true, message: "Player promoted from waiting list" };
      } catch (error: any) {
        console.error('Error promoting from waiting list:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  removeFromWaitingList: adminProcedure
    .input(z.object({ waitingListId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      try {
        const entry = await db.select().from(waitingList).where(eq(waitingList.id, input.waitingListId)).limit(1);
        if (!entry.length) throw new TRPCError({ code: "NOT_FOUND", message: "Waiting list entry not found" });

        await db.update(waitingList)
          .set({ status: "declined" })
          .where(eq(waitingList.id, input.waitingListId));

        await db.insert(notifications).values({
          recipientId: entry[0].registrationId,
          recipientType: "player",
          type: "rejection",
          title: "Waiting List Status Update",
          message: "Unfortunately, you were not selected from the waiting list for this season.",
          relatedId: entry[0].seasonId,
          emailSent: false,
        });

        return { success: true, message: "Player removed from waiting list" };
      } catch (error: any) {
        console.error('Error removing from waiting list:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  // ============ EVALUATION GAMES ============
  removeFromEvaluationGame: adminProcedure
    .input(z.object({ registrationId: z.number(), evaluationDate: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      try {
        await db.update(playerRegistrations)
          .set({ evaluationDate: null })
          .where(eq(playerRegistrations.id, input.registrationId));
        
        await db.delete(evaluationGameAssignments)
          .where(and(
            eq(evaluationGameAssignments.registrationId, input.registrationId),
            eq(evaluationGameAssignments.evaluationDate, input.evaluationDate)
          ));
        
        await db.insert(notifications).values({
          recipientId: input.registrationId,
          recipientType: "player",
          type: "game_assignment",
          title: "Removed from Evaluation Game",
          message: `You have been removed from the evaluation game on ${input.evaluationDate}.`,
          relatedId: input.registrationId,
          emailSent: false,
        });
        
        return { success: true, message: "Player removed from evaluation game" };
      } catch (error: any) {
        console.error('Error removing from evaluation game:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  assignEvaluationTeam: adminProcedure
    .input(z.object({ registrationId: z.number(), evaluationDate: z.string(), team: z.enum(["white", "black"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      try {
        await db.delete(evaluationGameAssignments)
          .where(and(
            eq(evaluationGameAssignments.registrationId, input.registrationId),
            eq(evaluationGameAssignments.evaluationDate, input.evaluationDate)
          ));
        
        await db.insert(evaluationGameAssignments).values({
          registrationId: input.registrationId,
          evaluationDate: input.evaluationDate,
          team: input.team,
        });
        
        await db.insert(notifications).values({
          recipientId: input.registrationId,
          recipientType: "player",
          type: "game_assignment",
          title: "Evaluation Game Team Assignment",
          message: `You have been assigned to the ${input.team} team for the evaluation game on ${input.evaluationDate}.`,
          relatedId: input.registrationId,
          emailSent: false,
        });
        
        return { success: true, message: `Player assigned to ${input.team} team` };
      } catch (error: any) {
        console.error('Error assigning evaluation team:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  getEvaluationTeamAssignment: adminProcedure
    .input(z.object({ registrationId: z.number(), evaluationDate: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const result = await db.select()
        .from(evaluationGameAssignments)
        .where(and(
          eq(evaluationGameAssignments.registrationId, input.registrationId),
          eq(evaluationGameAssignments.evaluationDate, input.evaluationDate)
        ))
        .limit(1);
      
      return result[0] || null;
    }),

  deletePlayer: adminProcedure
    .input(z.object({ registrationId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        // Delete all related data for this player
        // 1. Delete evaluation game assignments
        await db.delete(evaluationGameAssignments)
          .where(eq(evaluationGameAssignments.registrationId, input.registrationId));
        
        // 2. Delete from waiting list if present
        await db.delete(waitingList)
          .where(eq(waitingList.registrationId, input.registrationId));
        
        // 3. Get playerTeams to delete related stats and badges
        const playerTeamsData = await db.select()
          .from(playerTeams)
          .where(eq(playerTeams.registrationId, input.registrationId));
        
        for (const pt of playerTeamsData) {
          // Delete player stats
          await db.delete(playerStats)
            .where(eq(playerStats.playerTeamId, pt.id));
          
          // Delete game stats
          await db.delete(gameStats)
            .where(eq(gameStats.playerTeamId, pt.id));
          
          // Delete badges
          await db.delete(badges)
            .where(eq(badges.playerTeamId, pt.id));
          
          // Delete team messages from this player
          await db.delete(teamMessages)
            .where(eq(teamMessages.fromPlayerId, input.registrationId));
        }
        
        // 4. Delete playerTeams entries
        await db.delete(playerTeams)
          .where(eq(playerTeams.registrationId, input.registrationId));
        
        // 5. Delete admin messages to this player (if table exists)
        try {
          await db.delete(adminMessages)
            .where(eq(adminMessages.toPlayerTeamId, input.registrationId));
        } catch (e) {
          // Table might not exist, continue
        }
        
        // 6. Delete notifications
        await db.delete(notifications)
          .where(eq(notifications.recipientId, input.registrationId));
        
        // 7. Finally, delete the registration
        await db.delete(playerRegistrations)
          .where(eq(playerRegistrations.id, input.registrationId));
        
        return { success: true, message: 'Player and all related data deleted successfully' };
      } catch (error: any) {
        console.error('Error deleting player:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  updatePlayerInfo: adminProcedure
    .input(z.object({
      registrationId: z.number(),
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      rating: z.number().optional(),
      paymentMethod: z.enum(["eTransfer", "cash", "arrangement"]).optional(),
      teamId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.email) updateData.email = input.email;
      if (input.phone) updateData.phone = input.phone;
      if (input.rating !== undefined) updateData.rating = input.rating;
      if (input.paymentMethod) updateData.paymentMethod = input.paymentMethod;
      if (input.teamId !== undefined) updateData.teamId = input.teamId;
      
      await db.update(playerRegistrations)
        .set(updateData)
        .where(eq(playerRegistrations.id, input.registrationId));
      
      return { success: true };
    }),

  updatePlayerStatus: adminProcedure
    .input(z.object({
      registrationId: z.number(),
      status: z.enum(["pending", "approved", "rejected", "deleted"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      if (input.status === "deleted") {
        await db.delete(evaluationGameAssignments)
          .where(eq(evaluationGameAssignments.registrationId, input.registrationId));
        await db.delete(waitingList)
          .where(eq(waitingList.registrationId, input.registrationId));
        
        const playerTeamsData = await db.select()
          .from(playerTeams)
          .where(eq(playerTeams.registrationId, input.registrationId));
        
        for (const pt of playerTeamsData) {
          await db.delete(playerStats)
            .where(eq(playerStats.playerTeamId, pt.id));
          await db.delete(gameStats)
            .where(eq(gameStats.playerTeamId, pt.id));
          await db.delete(badges)
            .where(eq(badges.playerTeamId, pt.id));
          await db.delete(teamMessages)
            .where(eq(teamMessages.fromPlayerId, input.registrationId));
        }
        
        await db.delete(playerTeams)
          .where(eq(playerTeams.registrationId, input.registrationId));
        
        try {
          await db.delete(adminMessages)
            .where(eq(adminMessages.toPlayerTeamId, input.registrationId));
        } catch (e) {}
        
        await db.delete(notifications)
          .where(eq(notifications.recipientId, input.registrationId));
        
        await db.delete(playerRegistrations)
          .where(eq(playerRegistrations.id, input.registrationId));
      } else {
        await db.update(playerRegistrations)
          .set({ status: input.status })
          .where(eq(playerRegistrations.id, input.registrationId));
      }
      
      return { success: true };
    }),

  updatePlayerPosition: adminProcedure
    .input(z.object({
      playerTeamId: z.number(),
      position: z.enum(["forward", "defense", "goalie"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      await db.update(playerTeams)
        .set({ position: input.position })
        .where(eq(playerTeams.id, input.playerTeamId));
      
      return { success: true };
    }),

  updatePlayerEmail: adminProcedure
    .input(z.object({
      registrationId: z.number(),
      newEmail: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const player = await db.select().from(playerRegistrations)
        .where(eq(playerRegistrations.id, input.registrationId))
        .limit(1);
      
      if (!player || player.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Player not found" });
      }
      
      const playerData = player[0];
      const playerName = `${playerData.firstName} ${playerData.lastName}`;
      
      const emailBody = `Hi ${playerName},\n\nYour email address has been changed in the MIHL system. This is now your login email address.\n\nIf you did not request this change, please contact registration@mihl.ca immediately.`;
      
      console.log(`[EMAIL] To: ${input.newEmail}\nSubject: Your Email Address Has Been Updated\n${emailBody}`);
      
      await db.update(playerRegistrations)
        .set({ email: input.newEmail })
        .where(eq(playerRegistrations.id, input.registrationId));
      
      return { success: true, message: "Email updated successfully" };
    }),

  updatePlayerPicture: adminProcedure
    .input(z.object({
      registrationId: z.number(),
      pictureUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      await db.update(playerRegistrations)
        .set({ playerPictureUrl: input.pictureUrl })
        .where(eq(playerRegistrations.id, input.registrationId));
      
      return { success: true, message: "Picture updated successfully" };
    }),

  // ============ SCHEDULE MANAGEMENT ============
  getGamesBySeasonId: adminProcedure
    .input(z.object({ seasonId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await db
        .select({
          id: games.id,
          gameDate: games.gameDate,
          gameTime: games.gameTime,
          homeTeamId: games.homeTeamId,
          awayTeamId: games.awayTeamId,
          venueId: games.venueId,
          homeTeamName: masterTeams.name,
          awayTeamName: masterTeams.name,
          venue: gameVenues,
        })
        .from(games)
        .leftJoin(teams, eq(games.homeTeamId, teams.id))
        .leftJoin(masterTeams, eq(teams.masterTeamId, masterTeams.id))
        .leftJoin(gameVenues, eq(games.venueId, gameVenues.id))
        .where(eq(games.seasonId, input.seasonId))
        .orderBy(games.gameDate, games.gameTime);

      return result.map(g => ({
        id: g.id,
        gameDate: g.gameDate,
        gameTime: g.gameTime,
        homeTeam: { id: g.homeTeamId, name: g.homeTeamName || 'Unknown' },
        awayTeam: { id: g.awayTeamId, name: g.awayTeamName || 'Unknown' },
        venue: g.venue ? { id: g.venue.id, name: g.venue.name } : null,
      }));
    }),

  deleteGame: adminProcedure
    .input(z.object({ gameId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const game = await db.select().from(games).where(eq(games.id, input.gameId)).limit(1);
      if (!game || game.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found" });
      }

       await db.delete(games).where(eq(games.id, input.gameId));
      return { success: true, message: "Game deleted successfully" };
    }),

  // ============ SEASON MANAGEMENT ============
  getAllSeasons: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const allSeasons = await db.select().from(seasons);
    
    // Get game counts for each season
    const seasonStats = await Promise.all(
      allSeasons.map(async (season) => {
        const gameCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(games)
          .where(eq(games.seasonId, season.id));
        
        const teamCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(teams)
          .where(eq(teams.seasonId, season.id));
        
        return {
          ...season,
          gameCount: gameCount[0]?.count || 0,
          teamCount: teamCount[0]?.count || 0,
        };
      })
    );

    return seasonStats;
  }),

  deleteSeasonData: adminProcedure
    .input(z.object({ seasonId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check if season exists
      const season = await db.select().from(seasons).where(eq(seasons.id, input.seasonId)).limit(1);
      if (!season || season.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Season not found" });
      }

      // Delete all related data in order of dependencies
      try {
        // First, get all game IDs for this season
        const seasonGames = await db.select({ id: games.id }).from(games).where(eq(games.seasonId, input.seasonId));
        const gameIds = seasonGames.map(g => g.id);

        // 1. Delete staff assignments for these games
        if (gameIds.length > 0) {
          try {
            await db.delete(staffGameAssignments).where(inArray(staffGameAssignments.gameId, gameIds));
          } catch (e) {
            // Continue if fails
          }
        }

        // 2. Delete games
        await db.delete(games).where(eq(games.seasonId, input.seasonId));

        // 4. Delete player teams
        try {
          await db.delete(playerTeams).where(eq(playerTeams.seasonId, input.seasonId));
        } catch (e) {
          // Continue if fails
        }

        // 5. Delete teams
        await db.delete(teams).where(eq(teams.seasonId, input.seasonId));

        // 6. Delete season
        await db.delete(seasons).where(eq(seasons.id, input.seasonId));
      } catch (error) {
        console.error('Error deleting season data:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete season data' });
      }

      return { success: true, message: `Season and all associated data deleted successfully` };
    }),

  updateSeasonStatus: adminProcedure
    .input(z.object({ seasonId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const season = await db.select().from(seasons).where(eq(seasons.id, input.seasonId)).limit(1);
      if (!season || season.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Season not found" });
      }

      // If activating this season, deactivate all others
      if (input.isActive) {
        await db.update(seasons).set({ isActive: false });
      }

      await db.update(seasons).set({ isActive: input.isActive }).where(eq(seasons.id, input.seasonId));

      return { success: true, message: `Season status updated` };
    }),

  setActiveSeason: adminProcedure
    .input(z.object({ seasonId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check if season exists
      const season = await db.select().from(seasons).where(eq(seasons.id, input.seasonId)).limit(1);
      if (!season || season.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Season not found" });
      }

      // Deactivate all other seasons
      await db.update(seasons).set({ isActive: false });

      // Activate the selected season
      await db.update(seasons).set({ isActive: true }).where(eq(seasons.id, input.seasonId));

      return { success: true, message: `Season set as active` };
    })
});
