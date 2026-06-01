import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { refereeApplications, staffAvailability } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { broadcastStaffAvailabilityUpdate } from '../_core/websocket';

const applicationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  interacEmail: z.string().email(),
  role: z.enum(['referee', 'scorekeeper']),
  isCertified: z.boolean(),
  certifications: z.array(z.union([
    z.string(),
    z.object({ type: z.string(), year: z.number() })
  ])),
  yearsOfExperience: z.number().min(0),
  hockeyLevels: z.array(z.string()),
  desiredPayPerGame: z.string().optional(),
});

export const refereeRouter = router({
  submitApplication: publicProcedure
    .input(applicationSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      
      // Map input to match the actual refereeApplications schema
      await db.insert(refereeApplications).values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        interacEmail: input.interacEmail,
        role: input.role,
        isCertified: input.isCertified,
        // Transform certifications - handle both strings and objects
        certifications: input.certifications.map(c => 
          typeof c === 'string' 
            ? { type: c, year: new Date().getFullYear() }
            : c
        ),
        yearsOfExperience: input.yearsOfExperience,
        hockeyLevels: input.hockeyLevels,
        status: 'pending',
        selectedGames: [],
        desiredSalary: input.desiredPayPerGame ? input.desiredPayPerGame : null,
      });
      
      return { success: true };
    }),

  getMyApplication: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      const apps = await db
        .select()
        .from(refereeApplications)
        .where(eq(refereeApplications.email, ctx.user?.email || ""))
        .limit(1);
      
      return apps[0] || null;
    }),

  selectGameAvailability: protectedProcedure
    .input(z.object({ selectedGameIds: z.array(z.number()) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      // Try to find application by userId first, then fall back to email
      let apps = await db
        .select()
        .from(refereeApplications)
        .where(eq(refereeApplications.userId, ctx.user.id))
        .limit(1);
      
      if (!apps.length) {
        // Fall back to email matching for backward compatibility
        apps = await db
          .select()
          .from(refereeApplications)
          .where(eq(refereeApplications.email, ctx.user?.email || ""))
          .limit(1);
      }
      
      const app = apps[0];

      if (!app || app.status !== 'approved') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Application not found or not approved.' });
      }

      // Update the refereeApplications record with selected games
      await db.update(refereeApplications)
        .set({ selectedGames: input.selectedGameIds })
        .where(eq(refereeApplications.id, app.id));

      // Delete old staffAvailability records for this referee
      await db.delete(staffAvailability)
        .where(eq(staffAvailability.staffApplicationId, app.id));

      // Create new staffAvailability records for each selected game
      if (input.selectedGameIds.length > 0) {
        const availabilityRecords = input.selectedGameIds.map(gameId => ({
          staffApplicationId: app.id,
          gameId: gameId,
          isAvailable: true,
        }));
        await db.insert(staffAvailability).values(availabilityRecords);
      }

      // Broadcast real-time update to all connected clients
      broadcastStaffAvailabilityUpdate({
        staffApplicationId: app.id,
        staffName: `${app.firstName} ${app.lastName}`,
        role: app.role,
        selectedGameIds: input.selectedGameIds,
        email: app.email,
      });

      return { success: true };
    }),
});
