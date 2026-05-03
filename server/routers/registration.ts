import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { TRPCError } from '@trpc/server';
import { playerRegistrations } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const registrationSchema = z.object({
  registrationType: z.enum(['individual', 'team', 'spare', 'referee', 'scorekeeper']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10,}/),
  rating: z.number().min(1).max(10).optional(),
  position: z.enum(['forward', 'defenseman', 'goalie']).optional(),
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
    rating: z.number().min(1).max(10),
  })).optional(),
  emergencyName: z.string(),
  emergencyPhone: z.string(),
  emergencyRelationship: z.string(),
  waiverSigned: z.boolean(),
  waiverSignature: z.string(),
  language: z.enum(['en', 'fr']).default('en'),
});

async function sendRegistrationEmail(data: any, language: 'en' | 'fr') {
  const subject = language === 'en' 
    ? 'New Player Registration - MIHL League'
    : 'Nouvelle Inscription de Joueur - Ligue MIHL';

  const emailBody = language === 'en'
    ? `New registration received:\n\nName: ${data.firstName} ${data.lastName}\nEmail: ${data.email}\nType: ${data.registrationType}\nRating: ${data.rating || 'N/A'}`
    : `Nouvelle inscription reçue:\n\nNom: ${data.firstName} ${data.lastName}\nCourriel: ${data.email}\nType: ${data.registrationType}\nNiveau: ${data.rating || 'N/A'}`;

  console.log(`[EMAIL] To: registration@mihl.ca\nSubject: ${subject}\n${emailBody}`);
}

async function sendApprovalEmail(playerEmail: string, playerName: string, language: 'en' | 'fr') {
  const subject = language === 'en'
    ? 'Your MIHL Registration Has Been Approved!'
    : 'Votre Inscription à la Ligue MIHL a été Approuvée!';

  const body = language === 'en'
    ? `Hi ${playerName},\n\nYour registration for the MIHL league has been approved! You will receive your team assignment after the evaluation games on June 24-26.`
    : `Bonjour ${playerName},\n\nVotre inscription à la ligue MIHL a été approuvée! Vous recevrez votre assignation d'équipe après les matchs d'évaluation du 24-26 juin.`;

  console.log(`[EMAIL] To: ${playerEmail}\nSubject: ${subject}\n${body}`);
}

async function sendRejectionEmail(playerEmail: string, playerName: string, reason: string, language: 'en' | 'fr') {
  const subject = language === 'en'
    ? 'MIHL Registration Status Update'
    : 'Mise à Jour du Statut d\'Inscription MIHL';

  const body = language === 'en'
    ? `Hi ${playerName},\n\nUnfortunately, your registration could not be approved at this time.\n\nReason: ${reason}\n\nPlease contact registration@mihl.ca for more information.`
    : `Bonjour ${playerName},\n\nMalheureusement, votre inscription n'a pas pu être approuvée à ce moment.\n\nRaison: ${reason}\n\nVeuillez contacter registration@mihl.ca pour plus d'informations.`;

  console.log(`[EMAIL] To: ${playerEmail}\nSubject: ${subject}\n${body}`);
}

export const registrationRouter = router({
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

        // Create registration record
        const result = await db.insert(playerRegistrations).values({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          registrationType: input.registrationType as any,
          playerRating: input.rating || null,
          position: input.position as any || null,
          preferredTeamId: null,
          status: 'pending',
          paymentStatus: 'unpaid',
          seasonId: 1,
          userId: 0,
          isFirstTime: false,
          wantsCaptain: input.wantsCaptain || false,
        });

        // Send admin notification
        await sendRegistrationEmail(input, input.language);

        return {
          success: true,
          registrationId: (result as any).insertId || 0,
          message: input.language === 'en'
            ? 'Registration submitted successfully. You will receive an email confirmation.'
            : 'Inscription soumise avec succès. Vous recevrez une confirmation par courriel.',
        };
      } catch (error) {
        console.error('Registration submission error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit registration',
        });
      }
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

      await sendApprovalEmail(reg.email, `${reg.firstName} ${reg.lastName}`, input.language);

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

      await sendRejectionEmail(reg.email, `${reg.firstName} ${reg.lastName}`, input.reason, input.language);

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
        .set({ paymentStatus: input.amountPaid > 0 ? 'paid' : 'unpaid' })
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
});
