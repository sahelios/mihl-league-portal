import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
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
      
      // Explicitly mapping the input to strictly match the Drizzle MySQL schema types
      await db.insert(refereeApplications).values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        interacEmail: input.interacEmail,
        role: input.role,
        certificationStatus: input.isCertified ? 'certified' : 'uncertified',
        // Transforming array of strings to the required JSON array of objects
        certifications: input.certifications.map(c => ({ type: c, year: new Date().getFullYear() })),
        yearsExperience: input.yearsOfExperience,
        hockeyLevels: input.hockeyLevels,
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

      // Using db.select().from() to avoid the 'Aliased' typing error found in db.query
      const apps = await db
        .select()
        .from(refereeApplications)
        .where(eq(refereeApplications.email, ctx.user.email))
        .limit(1);
      
      return apps[0] || null;
    }),

  selectGameAvailability: protectedProcedure
    .input(z.object({ selectedGameIds: z.array(z.number()) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      const apps = await db
        .select()
        .from(refereeApplications)
        .where(eq(refereeApplications.email, ctx.user.email))
        .limit(1);

      const app = apps[0];

      if (!app || app.status !== 'approved') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Application not found or not approved.' });
      }

      // First argument inside .where() MUST be the column reference, not the value
      await db.update(refereeApplications)
        .set({ selectedGames: input.selectedGameIds, updatedAt: new Date() })
        .where(eq(refereeApplications.id, app.id));

      return { success: true };
    }),
});