import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const leagueRouter = router({
  // ============ SCHEDULE PROCEDURES ============
  getSchedule: publicProcedure
    .input(z.object({ status: z.enum(['upcoming', 'completed', 'all']).default('all') }))
    .query(async ({ input }) => {
      // Mocked games schedule
      const games = [
        { id: 1, date: "2026-06-24", time: "19:00", teamAName: "Iron Lions", teamBName: "Golan Guards", venue: "Samuel Moscovitch Arena", status: "completed", teamAScore: 4, teamBScore: 2, scorers: "Player 1 (2), Player 5", assists: "Player 2" },
        { id: 2, date: "2026-06-25", time: "20:30", teamAName: "H Hammers", teamBName: "Schvitz Saints", venue: "Outremont Arena", status: "completed", teamAScore: 3, teamBScore: 5 },
        { id: 3, date: "2026-06-28", time: "18:00", teamAName: "Iron Lions", teamBName: "H Hammers", venue: "Samuel Moscovitch Arena", status: "upcoming", teamAScore: null, teamBScore: null },
        { id: 4, date: "2026-06-29", time: "21:00", teamAName: "Golan Guards", teamBName: "Schvitz Saints", venue: "Outremont Arena", status: "upcoming", teamAScore: null, teamBScore: null },
      ];

      if (input.status === 'all') return games;
      return games.filter(g => g.status === input.status);
    }),

  getGameDetails: publicProcedure
    .input(z.object({ gameId: z.number() }))
    .query(async ({ input }) => {
      return {
        id: input.gameId,
        date: "2026-06-24",
        time: "19:00",
        teamAName: "Iron Lions",
        teamBName: "Golan Guards",
        venue: "Samuel Moscovitch Arena",
        status: "completed",
        teamAScore: 4,
        teamBScore: 2,
        scorers: "Lion A (2), Lion B (1), Lion C (1) | Guard X (1), Guard Y (1)",
        assists: "Lion D (2) | Guard Z (1)",
        attendance: "85 spectators"
      };
    }),

  getGamesByTeam: publicProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ input }) => {
      return []; // Return filtered games for a specific team
    }),

  getGamesByDate: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      return []; // Return filtered games for a specific date
    }),

  // ============ PLAYOFF PROCEDURES ============
  getPlayoffBracket: publicProcedure.query(async () => {
    return [
      { id: "sf1", round: 1, matchNumber: 1, team1: "Iron Lions", team1Score: 2, team2: "Schvitz Saints", team2Score: 0, status: "in_progress", bestOf: 3, gameDate: "2026-08-15", time: "20:00" },
      { id: "sf2", round: 1, matchNumber: 2, team1: "Golan Guards", team1Score: 0, team2: "H Hammers", team2Score: 0, status: "scheduled", bestOf: 3, gameDate: "2026-08-17", time: "21:30" },
      { id: "fin1", round: 2, matchNumber: 3, team1: "TBD", team1Score: 0, team2: "TBD", team2Score: 0, status: "scheduled", bestOf: 1, gameDate: "2026-08-25", time: "20:30" },
    ];
  }),

  getPlayoffStandings: publicProcedure.query(async () => {
    return [
      { name: "Iron Lions", seed: 1, wins: 2, losses: 0, status: "Active", nextOpponent: "Schvitz Saints", nextGame: "Aug 18, 2026" },
      { name: "Golan Guards", seed: 2, wins: 0, losses: 0, status: "Active", nextOpponent: "H Hammers", nextGame: "Aug 17, 2026" },
      { name: "H Hammers", seed: 3, wins: 0, losses: 0, status: "Active", nextOpponent: "Golan Guards", nextGame: "Aug 17, 2026" },
      { name: "Schvitz Saints", seed: 4, wins: 0, losses: 2, status: "Elimination Risk", nextOpponent: "Iron Lions", nextGame: "Aug 18, 2026" },
    ];
  }),

  getPlayoffSeries: publicProcedure
    .input(z.object({ seriesId: z.string() }))
    .query(async ({ input }) => {
      return { seriesId: input.seriesId, games: [] };
    }),

  getPlayoffSchedule: publicProcedure.query(async () => {
    return [];
  }),

  // ============ TEAM BALANCING PROCEDURES ============
  balanceTeamsAfterEvaluation: protectedProcedure.mutation(async ({ ctx }) => {
    // Requires admin access. Normally fetches all approved players, runs the balance utility, and persists to DB.
    if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return { success: true, message: "Teams have been successfully balanced." };
  }),

  getBalancedTeams: publicProcedure.query(async () => {
    return []; // Return current active balanced teams
  }),

  getTeamAssignments: publicProcedure.query(async () => {
    return []; // Return specific player-to-team assignments
  }),
});