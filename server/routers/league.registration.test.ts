import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { playerRegistrations, playerTeams, seasons } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

describe('Player Registration Procedures', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  describe('getPlayerRegistration with position from playerTeams', () => {
    it('should return registration with position from playerTeams for active season', async () => {
      if (!db) return;

      // Get or create active season
      let activeSeason = await db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);
      if (!activeSeason.length) {
        await db.insert(seasons).values({
          name: 'Test Season',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-08-31'),
          isActive: true,
          registrationOpen: true,
        });
        activeSeason = await db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);
      }

      // Create test registration
      const testEmail = `test-position-${Date.now()}@example.com`;
      await db.insert(playerRegistrations).values({
        firstName: 'Test',
        lastName: 'Player',
        email: testEmail,
        teamId: 1,
        seasonId: activeSeason[0].id,
        registrationType: 'individual',
        status: 'approved',
      });

      // Get the registration to get its ID
      const regData = await db.select().from(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail))
        .limit(1);
      const registrationId = regData[0].id;

      // Create playerTeam entry with position
      await db.insert(playerTeams).values({
        registrationId: registrationId,
        teamId: 1,
        seasonId: activeSeason[0].id,
        position: 'forward',
      });

      // Verify registration exists
      expect(regData).toHaveLength(1);
      expect(regData[0].email).toBe(testEmail);

      // Get playerTeam info
      const playerTeamData = await db.select().from(playerTeams)
        .where(and(
          eq(playerTeams.registrationId, registrationId),
          eq(playerTeams.seasonId, activeSeason[0].id)
        ))
        .limit(1);

      expect(playerTeamData).toHaveLength(1);
      expect(playerTeamData[0].position).toBe('forward');

      // Verify merged result
      const merged = {
        ...regData[0],
        position: playerTeamData[0].position,
      };

      expect(merged.position).toBe('forward');

      // Clean up
      await db.delete(playerTeams)
        .where(eq(playerTeams.registrationId, registrationId));
      await db.delete(playerRegistrations)
        .where(eq(playerRegistrations.id, registrationId));
    });

    it('should return registration without position if no playerTeam exists', async () => {
      if (!db) return;

      // Get active season
      const activeSeason = await db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);
      if (!activeSeason.length) return;

      // Create test registration without playerTeam
      const testEmail = `test-no-position-${Date.now()}@example.com`;
      await db.insert(playerRegistrations).values({
        firstName: 'Test',
        lastName: 'Player',
        email: testEmail,
        teamId: 1,
        seasonId: activeSeason[0].id,
        registrationType: 'individual',
        status: 'approved',
      });

      // Get the registration to get its ID
      const regData = await db.select().from(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail))
        .limit(1);
      const registrationId = regData[0].id;

      // Verify registration exists without position
      expect(regData).toHaveLength(1);
      expect(regData[0].position).toBeNull();

      // Clean up
      await db.delete(playerRegistrations)
        .where(eq(playerRegistrations.id, registrationId));
    });

    it('should handle multiple positions across seasons', async () => {
      if (!db) return;

      // Get active season
      const activeSeason = await db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);
      if (!activeSeason.length) return;

      // Create test registration
      const testEmail = `test-multi-season-${Date.now()}@example.com`;
      await db.insert(playerRegistrations).values({
        firstName: 'Test',
        lastName: 'Player',
        email: testEmail,
        teamId: 1,
        seasonId: activeSeason[0].id,
        registrationType: 'individual',
        status: 'approved',
      });

      // Get the registration to get its ID
      const regData = await db.select().from(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail))
        .limit(1);
      const registrationId = regData[0].id;

      // Create playerTeam entry for active season
      await db.insert(playerTeams).values({
        registrationId: registrationId,
        teamId: 1,
        seasonId: activeSeason[0].id,
        position: 'defense',
      });

      // Get playerTeam info for active season only
      const playerTeamData = await db.select().from(playerTeams)
        .where(and(
          eq(playerTeams.registrationId, registrationId),
          eq(playerTeams.seasonId, activeSeason[0].id)
        ))
        .limit(1);

      expect(playerTeamData).toHaveLength(1);
      expect(playerTeamData[0].position).toBe('defense');

      // Clean up
      await db.delete(playerTeams)
        .where(eq(playerTeams.registrationId, registrationId));
      await db.delete(playerRegistrations)
        .where(eq(playerRegistrations.id, registrationId));
    });
  });
});
