import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { refereeApplications } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const applicationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  interacEmail: z.string().email(),
  role: z.enum(['referee', 'scorekeeper']),
  isCertified: z.boolean(),
  certifications: z.array(z.string()),
  yearsOfExperience: z.number().min(0),
  hockeyLevels: z.array(z.string()),
});

export const refereeRouter = router({
  submitApplication: publicProcedure
    .input(applicationSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      
      await db.insert(refereeApplications).values({
        ...input,
        status: 'pending',
        selectedGames: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return { success: true };
    }),

  getMyApplication: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      // Assuming user email matches application email
      const app = await db.query.refereeApplications.findFirst({
        where: eq(refereeApplications.email, ctx.user.email)
      });
      
      return app;
    }),

  selectGameAvailability: protectedProcedure
    .input(z.object({ selectedGameIds: z.array(z.number()) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      const app = await db.query.refereeApplications.findFirst({
        where: eq(refereeApplications.email, ctx.user.email)
      });

      if (!app || app.status !== 'approved') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Application not approved.' });
      }

      await db.update(refereeApplications)
        .set({ selectedGames: input.selectedGameIds, updatedAt: new Date() })
        .where(eq(refereeApplications.id, app.id));

      return { success: true };
    }),
});