import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { TRPCError } from '@trpc/server';
import { playerRegistrations, seasons, playerTeams, evaluationGameAssignments } from '../../drizzle/schema';
import { eq, and, sql, or } from 'drizzle-orm';
import { sendRegistrationConfirmationEmail, sendRegistrationAdminNotification } from '../_core/emailService';

// Evaluation game dates and capacity
const EVALUATION_DATES = [
  { date: '2026-06-23', label: 'Sunday, June 23, 2026', venue: 'Samuel Moscovitch Arena', time: '9:30 PM' },
  { date: '2026-06-25', label: 'Tuesday, June 25, 2026', venue: 'Outremont Arena', time: '10:00 PM' },
];
const MAX_PLAYERS_PER_DATE = 24;
const MAX_GOALIES_PER_DATE = 2;

// Get active season
async function getActiveSeason() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);
  return result[0] || null;
}

const registrationSchema = z.object({
  registrationType: z.enum(['individual', 'team', 'spare', 'referee', 'scorekeeper']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10,}/),
  playerRating: z.number().min(1).max(10).optional(),
  position: z.enum(['forward', 'defense', 'goalie']).optional(),
  paymentMethod: z.enum(['eTransfer', 'cash', 'arrangement']).optional(),
  preferredTeam: z.string().optional(),
  friendRequests: z.array(z.string()).optional(),
  wantsCaptain: z.boolean().optional(),
  teamName: z.string().optional(),
  teamPlayers: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    position: z.enum(['forward', 'defenseman', 'goalie']),
        playerRating: z.number().min(1).max(10),
  })).optional(),
  emergencyName: z.string(),
  emergencyPhone: z.string(),
  emergencyRelationship: z.string(),
  waiverSigned: z.boolean(),
  waiverSignature: z.string(),
  language: z.enum(['en', 'fr']).default('en'),
  evaluationDate: z.string().optional(),
});





// Add getActiveSeason procedure
export const registrationRouter = router({
  getActiveSeason: publicProcedure.query(async () => {
    return await getActiveSeason();
  }),

  getEvaluationCapacity: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) {
        // Return default capacity if DB unavailable
        return EVALUATION_DATES.map(d => ({
          ...d,
          playersRegistered: 0,
          goaliesRegistered: 0,
          playerSpotsLeft: MAX_PLAYERS_PER_DATE,
          goalieSpotsLeft: MAX_GOALIES_PER_DATE,
          maxPlayers: MAX_PLAYERS_PER_DATE,
          maxGoalies: MAX_GOALIES_PER_DATE,
        }));
      }

      const results = await Promise.all(EVALUATION_DATES.map(async (evalDate) => {
        // Count players (non-goalie) registered for this date
        const playerCount = await db.select({ count: sql<number>`count(*)` })
          .from(playerRegistrations)
          .where(eq(playerRegistrations.evaluationDate, evalDate.date));

        // Count goalies registered for this date
        const totalCount = Number(playerCount[0]?.count || 0);

        return {
          ...evalDate,
          playersRegistered: totalCount,
          goaliesRegistered: 0,
          playerSpotsLeft: Math.max(0, MAX_PLAYERS_PER_DATE - totalCount),
          goalieSpotsLeft: 0,
          maxPlayers: MAX_PLAYERS_PER_DATE,
          maxGoalies: MAX_GOALIES_PER_DATE,
        };
      }));

      return results;
    }),

  // Public: get evaluation attendance for admin
  getEvaluationAttendance: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      const results = await Promise.all(EVALUATION_DATES.map(async (evalDate) => {
        const attendees = await db.select()
          .from(playerRegistrations)
          .where(eq(playerRegistrations.evaluationDate, evalDate.date));

        return {
          ...evalDate,
          attendees: attendees.map(a => ({
            id: a.id,
            firstName: a.firstName,
            lastName: a.lastName,
            email: a.email,
            registrationType: a.registrationType,
            status: a.status,
          })),
          totalPlayers: attendees.length,
          totalGoalies: 0,
          maxPlayers: MAX_PLAYERS_PER_DATE,
          maxGoalies: MAX_GOALIES_PER_DATE,
        };
      }));

      return results;
    }),

  submit: publicProcedure
    .input(registrationSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      try {
        // Validate team size for team registrations
        if (input.registrationType === 'team') {
          const playerCount = input.teamPlayers?.length || 0;
          if (playerCount < 10 || playerCount > 15) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Team must have 10-15 players',
            });
          }
        }

        // Validate evaluation date capacity for individual/spare registrations
        if (input.evaluationDate && (input.registrationType === 'individual' || input.registrationType === 'team')) {
          const totalCount = await db.select({ count: sql<number>`count(*)` })
            .from(playerRegistrations)
            .where(eq(playerRegistrations.evaluationDate, input.evaluationDate));
          if (Number(totalCount[0]?.count || 0) >= MAX_PLAYERS_PER_DATE) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: input.language === 'en'
                ? 'No spots remaining for this evaluation date. Please select another date.'
                : 'Plus de places disponibles pour cette date d\'évaluation. Veuillez choisir une autre date.',
            });
          }
        }

        // Create registration record
        // Map form values to database enum values (database only has 'individual' and 'team')
        const typeMap: Record<string, 'individual' | 'team'> = {
          'individual': 'individual',
          'team': 'team',
          'spare': 'individual',
          'referee': 'individual',
          'scorekeeper': 'individual',
        };

        // Get the active season
        const activeSeason = await getActiveSeason();
        if (!activeSeason) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'No active season found',
          });
        }

        const result = await db.insert(playerRegistrations).values({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          registrationType: typeMap[input.registrationType],
          status: 'pending',
          seasonId: activeSeason.id,
          teamId: 1,
          isFirstTime: false,
          paymentConfirmed: false,
          jerseyOrderConfirmed: false,
          evaluationDate: input.evaluationDate || null,
          playerRating: input.playerRating || null,
          paymentMethod: input.paymentMethod || null,
          position: input.position || null,
        });

        // Send admin notification and player confirmation (non-blocking)
        Promise.all([
          sendRegistrationAdminNotification(input, input.language),
          sendRegistrationConfirmationEmail(input.email, input.firstName, input.language),
        ]).catch(err => {
          console.error('Failed to send registration emails:', err);
        });

        return {
          success: true,
          registrationId: (result as any).insertId || 0,
          message: input.language === 'en'
            ? 'Registration submitted successfully. You will receive an email confirmation.'
            : 'Inscription soumise avec succès. Vous recevrez une confirmation par courriel.',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Registration submission error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit registration',
        });
      }
    }),

  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      return await db.select({
        id: playerRegistrations.id,
        firstName: playerRegistrations.firstName,
        lastName: playerRegistrations.lastName,
        email: playerRegistrations.email,
        phone: playerRegistrations.phone,
        teamId: playerRegistrations.teamId,
        seasonId: playerRegistrations.seasonId,
        isFirstTime: playerRegistrations.isFirstTime,
        registrationType: playerRegistrations.registrationType,
        status: playerRegistrations.status,
        waitingListStatus: playerRegistrations.waitingListStatus,
        paymentConfirmed: playerRegistrations.paymentConfirmed,
        paymentMethod: playerRegistrations.paymentMethod,
        jerseyOrderConfirmed: playerRegistrations.jerseyOrderConfirmed,
        evaluationDate: playerRegistrations.evaluationDate,
        playerRating: playerRegistrations.playerRating,
        playerPictureUrl: playerRegistrations.playerPictureUrl,
        createdAt: playerRegistrations.createdAt,
        updatedAt: playerRegistrations.updatedAt,
        position: playerRegistrations.position,
      }).from(playerRegistrations);
    }),

  getPending: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      const result = await db.select().from(playerRegistrations).where(eq(playerRegistrations.status, 'pending'));
      return result;
    }),

  approve: protectedProcedure
    .input(z.object({
      registrationId: z.number(),
      language: z.enum(['en', 'fr']).default('en'),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      const registration = await db.select().from(playerRegistrations).where(eq(playerRegistrations.id, input.registrationId));
      if (!registration.length) throw new TRPCError({ code: 'NOT_FOUND' });

      const reg = registration[0];
      await db.update(playerRegistrations)
        .set({ status: 'approved' })
        .where(eq(playerRegistrations.id, input.registrationId));

      // Fetch evaluation game assignment
      let evaluationGameInfo = null;
      const evalAssignment = await db.select()
        .from(evaluationGameAssignments)
        .where(eq(evaluationGameAssignments.registrationId, input.registrationId))
        .limit(1);
      
      if (evalAssignment.length > 0) {
        const assignment = evalAssignment[0];
        evaluationGameInfo = {
          date: assignment.evaluationDate,
          team: assignment.team === 'white' ? 'Team White' : 'Team Black',
        };
      }

      const { sendApprovalEmail: sendApprovalEmailService } = await import('../_core/emailService');
      // Send email non-blocking
      sendApprovalEmailService(
        reg.email,
        `${reg.firstName} ${reg.lastName}`,
        input.language,
        evaluationGameInfo
      ).catch(err => {
        console.error('Failed to send approval email:', err);
      });

      return { success: true };
    }),

  reject: protectedProcedure
    .input(z.object({
      registrationId: z.number(),
      reason: z.string(),
      language: z.enum(['en', 'fr']).default('en'),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      const registrations = await db.select().from(playerRegistrations).where(eq(playerRegistrations.id, input.registrationId));
      if (!registrations.length) throw new TRPCError({ code: 'NOT_FOUND' });

      const reg = registrations[0];
      await db.update(playerRegistrations)
        .set({ status: 'rejected' })
        .where(eq(playerRegistrations.id, input.registrationId));

      const { sendRejectionEmail: sendRejectionEmailService } = await import('../_core/emailService');
      // Send email non-blocking
      sendRejectionEmailService(reg.email, `${reg.firstName} ${reg.lastName}`, input.reason, input.language).catch(err => {
        console.error('Failed to send rejection email:', err);
      });

      return { success: true };
    }),

  markPaid: protectedProcedure
    .input(z.object({
      registrationId: z.number(),
      amountPaid: z.number().min(0),
      paymentDate: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      await db.update(playerRegistrations)
        .set({ paymentConfirmed: input.amountPaid > 0 })
        .where(eq(playerRegistrations.id, input.registrationId));

      return { success: true };
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      const pending = await db.select().from(playerRegistrations).where(eq(playerRegistrations.status, 'pending'));
      const approved = await db.select().from(playerRegistrations).where(eq(playerRegistrations.status, 'approved'));
      const rejected = await db.select().from(playerRegistrations).where(eq(playerRegistrations.status, 'rejected'));

      return {
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
        total: pending.length + approved.length + rejected.length,
      };
    }),

  register: publicProcedure
    .input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string(),
      evaluationDate: z.date(),
      isFirstTime: z.boolean().optional(),
      registrationType: z.enum(['player', 'referee', 'scorekeeper']),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      try {
        const result = await db.insert(playerRegistrations).values({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          registrationType: input.registrationType as any,
          status: 'pending',
          seasonId: 1,
          teamId: 1,
          isFirstTime: input.isFirstTime || false,
          paymentConfirmed: false,
          jerseyOrderConfirmed: false,
          evaluationDate: input.evaluationDate.toISOString().split('T')[0],
        });

        return { success: true, registrationId: (result as any).insertId || 0 };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to submit registration' });
      }
    }),

  // Assign player to team (admin only)
  assignTeam: protectedProcedure
    .input(z.object({
      registrationId: z.number(),
      teamId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      try {
        await db.update(playerRegistrations)
          .set({ teamId: input.teamId })
          .where(eq(playerRegistrations.id, input.registrationId));
        return { success: true, message: 'Player assigned to team' };
      } catch (error: any) {
        console.error('Error assigning team:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to assign team' });
      }
    }),

  // Update player rating (admin only)
  updatePlayerRating: protectedProcedure
    .input(z.object({
      registrationId: z.number(),
      rating: z.number().min(1).max(10),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      try {
        await db.update(playerRegistrations)
          .set({ playerRating: input.rating })
          .where(eq(playerRegistrations.id, input.registrationId));
        return { success: true, message: 'Player rating updated' };
      } catch (error: any) {
        console.error('Error updating rating:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to update rating' });
      }
    }),
});
