import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import {
  getActiveSeasonId,
  getUpcomingGames,
  getPlayerRegistrations,
  createPlayerRegistration,
  updatePlayerRegistration,
  getTeamsBySeasonId,
  getGamesBySeasonId,
  updateGameScore,
  getNewsPosts,
  createNewsPost,
  getBlogPosts,
  createBlogPost,
  getStarsOfWeek,
  createStarOfWeek,
  getSuspensions,
  createSuspension,
  updateSuspension,
} from "../db";
import { notifyOwner } from "../_core/notification";

export const leagueRouter = router({
  // Public queries
  getUpcomingGames: publicProcedure
    .input(z.object({ days: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const seasonId = await getActiveSeasonId();
      if (!seasonId) return [];
      return await getUpcomingGames(seasonId, input?.days || 14);
    }),

  getTeams: publicProcedure.query(async () => {
    const seasonId = await getActiveSeasonId();
    if (!seasonId) return [];
    return await getTeamsBySeasonId(seasonId);
  }),

  getSchedule: publicProcedure.query(async () => {
    const seasonId = await getActiveSeasonId();
    if (!seasonId) return [];
    return await getGamesBySeasonId(seasonId);
  }),

  getNews: publicProcedure.query(async () => {
    const seasonId = await getActiveSeasonId();
    if (!seasonId) return [];
    return await getNewsPosts(seasonId);
  }),

  getBlog: publicProcedure.query(async () => {
    const seasonId = await getActiveSeasonId();
    if (!seasonId) return [];
    return await getBlogPosts(seasonId);
  }),

  getStars: publicProcedure.query(async () => {
    const seasonId = await getActiveSeasonId();
    if (!seasonId) return [];
    return await getStarsOfWeek(seasonId);
  }),

  getSuspensions: publicProcedure.query(async () => {
    const seasonId = await getActiveSeasonId();
    if (!seasonId) return [];
    return await getSuspensions(seasonId);
  }),

  // Player registration
  submitRegistration: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        teamId: z.number(),
        isFirstTime: z.boolean().default(false),
        registrationType: z.enum(["individual", "team"]),
      })
    )
    .mutation(async ({ input }) => {
      const seasonId = await getActiveSeasonId();
      if (!seasonId) throw new Error("No active season");

      const registration = await createPlayerRegistration({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        teamId: input.teamId,
        seasonId,
        isFirstTime: input.isFirstTime,
        registrationType: input.registrationType,
        status: "pending",
      });

      // Notify admin
      await notifyOwner({
        title: "New Player Registration",
        content: `${input.firstName} ${input.lastName} (${input.email}) has registered for ${input.registrationType} play.`,
      });

      return registration;
    }),

  getPendingRegistrations: adminProcedure.query(async () => {
    const seasonId = await getActiveSeasonId();
    if (!seasonId) return [];
    return await getPlayerRegistrations(seasonId, "pending");
  }),

  getApprovedRegistrations: adminProcedure.query(async () => {
    const seasonId = await getActiveSeasonId();
    if (!seasonId) return [];
    return await getPlayerRegistrations(seasonId, "approved");
  }),

  // Admin: Approve/Reject registration
  approveRegistration: adminProcedure
    .input(z.object({ registrationId: z.number() }))
    .mutation(async ({ input }) => {
      await updatePlayerRegistration(input.registrationId, { status: "approved" });
      return { success: true };
    }),

  rejectRegistration: adminProcedure
    .input(z.object({ registrationId: z.number() }))
    .mutation(async ({ input }) => {
      await updatePlayerRegistration(input.registrationId, { status: "rejected" });
      return { success: true };
    }),

  // Admin: Update game score
  updateGameScore: adminProcedure
    .input(
      z.object({
        gameId: z.number(),
        homeScore: z.number(),
        awayScore: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await updateGameScore(input.gameId, input.homeScore, input.awayScore);
      return { success: true };
    }),

  // Admin: News management
  createNews: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const seasonId = await getActiveSeasonId();
      if (!seasonId) throw new Error("No active season");

      return await createNewsPost({
        title: input.title,
        content: input.content,
        imageUrl: input.imageUrl,
        authorId: ctx.user?.id,
        seasonId,
      });
    }),

  // Admin: Blog management
  createBlog: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const seasonId = await getActiveSeasonId();
      if (!seasonId) throw new Error("No active season");

      return await createBlogPost({
        title: input.title,
        content: input.content,
        imageUrl: input.imageUrl,
        authorId: ctx.user?.id,
        seasonId,
      });
    }),

  // Admin: Stars of the week
  selectStarOfWeek: adminProcedure
    .input(
      z.object({
        playerName: z.string().min(1),
        teamId: z.number(),
        weekNumber: z.number(),
        rating: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const seasonId = await getActiveSeasonId();
      if (!seasonId) throw new Error("No active season");

      return await createStarOfWeek({
        playerName: input.playerName,
        teamId: input.teamId,
        seasonId,
        weekNumber: input.weekNumber,
        rating: input.rating,
      });
    }),

  // Admin: Suspensions
  createSuspension: adminProcedure
    .input(
      z.object({
        playerName: z.string().min(1),
        teamId: z.number(),
        reason: z.string().min(1),
        startDate: z.string(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const seasonId = await getActiveSeasonId();
      if (!seasonId) throw new Error("No active season");

      return await createSuspension({
        playerName: input.playerName,
        teamId: input.teamId,
        seasonId,
        reason: input.reason,
        startDate: input.startDate as any,
        endDate: input.endDate as any,
        isActive: true,
      });
    }),

  updateSuspension: adminProcedure
    .input(
      z.object({
        suspensionId: z.number(),
        endDate: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await updateSuspension(input.suspensionId, {
        endDate: input.endDate as any,
        isActive: input.isActive,
      });
      return { success: true };
    }),
});
