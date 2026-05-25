import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { playerRegistrations, playerTeams, seasons } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

describe('Team Assignment - getPlayerRegistration', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  describe('Team ID from playerTeams override', () => {
    it('should return teamId from playerTeams for active season', async () => {
      if (!db) return;

      // Create test registration
      const testEmail = `test-team-${Date.now()}@example.com`;
      const regResult = await db.insert(playerRegistrations).values({
        firstName: 'Test',
        lastName: 'Team',
        email: testEmail,
        phone: '1234567890',
        registrationType: 'individual',
        status: 'approved',
        seasonId: 30001,
        teamId: 1, // Default team
        isFirstTime: false,
        paymentConfirmed: true,
        jerseyOrderConfirmed: false,
      });

      const registrationId = regResult[0].insertId;

      // Get active season
      const activeSeason = await db.select().from(seasons)
        .where(eq(seasons.isActive, true))
        .limit(1);

      if (!activeSeason.length) {
        // Clean up
        await db.delete(playerRegistrations)
          .where(eq(playerRegistrations.email, testEmail));
        return;
      }

      // Assign to different team (e.g., team 2 - Iron Lions)
      await db.insert(playerTeams).values({
        registrationId,
        teamId: 2, // Different team
        seasonId: activeSeason[0].id,
        jerseyNumber: 10,
        position: 'forward',
      });

      // Query the registration
      const regQuery = await db.select({
        id: playerRegistrations.id,
        teamId: playerRegistrations.teamId,
        email: playerRegistrations.email,
      }).from(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail))
        .limit(1);

      expect(regQuery).toHaveLength(1);
      expect(regQuery[0].teamId).toBe(1); // Original teamId

      // Now check playerTeams
      const playerTeamQuery = await db.select().from(playerTeams)
        .where(and(
          eq(playerTeams.registrationId, registrationId),
          eq(playerTeams.seasonId, activeSeason[0].id)
        ))
        .limit(1);

      expect(playerTeamQuery).toHaveLength(1);
      expect(playerTeamQuery[0].teamId).toBe(2); // Admin-assigned teamId

      // Clean up
      await db.delete(playerTeams)
        .where(eq(playerTeams.registrationId, registrationId));
      await db.delete(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail));
    });

    it('should use original teamId if no playerTeam entry exists', async () => {
      if (!db) return;

      const testEmail = `test-no-team-${Date.now()}@example.com`;
      await db.insert(playerRegistrations).values({
        firstName: 'Test',
        lastName: 'NoTeam',
        email: testEmail,
        phone: '1234567890',
        registrationType: 'individual',
        status: 'approved',
        seasonId: 30001,
        teamId: 1,
        isFirstTime: false,
        paymentConfirmed: true,
        jerseyOrderConfirmed: false,
      });

      const regQuery = await db.select({
        teamId: playerRegistrations.teamId,
      }).from(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail))
        .limit(1);

      expect(regQuery).toHaveLength(1);
      expect(regQuery[0].teamId).toBe(1);

      // Clean up
      await db.delete(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail));
    });

    it('should update teamId when admin changes team assignment', async () => {
      if (!db) return;

      const testEmail = `test-change-team-${Date.now()}@example.com`;
      const regResult = await db.insert(playerRegistrations).values({
        firstName: 'Test',
        lastName: 'ChangeTeam',
        email: testEmail,
        phone: '1234567890',
        registrationType: 'individual',
        status: 'approved',
        seasonId: 30001,
        teamId: 1,
        isFirstTime: false,
        paymentConfirmed: true,
        jerseyOrderConfirmed: false,
      });

      const registrationId = regResult[0].insertId;

      const activeSeason = await db.select().from(seasons)
        .where(eq(seasons.isActive, true))
        .limit(1);

      if (!activeSeason.length) {
        await db.delete(playerRegistrations)
          .where(eq(playerRegistrations.email, testEmail));
        return;
      }

      // Assign to team 2
      await db.insert(playerTeams).values({
        registrationId,
        teamId: 2,
        seasonId: activeSeason[0].id,
      });

      // Verify team 2
      let playerTeamQuery = await db.select().from(playerTeams)
        .where(and(
          eq(playerTeams.registrationId, registrationId),
          eq(playerTeams.seasonId, activeSeason[0].id)
        ))
        .limit(1);

      expect(playerTeamQuery[0].teamId).toBe(2);

      // Update to team 3
      await db.update(playerTeams)
        .set({ teamId: 3 })
        .where(and(
          eq(playerTeams.registrationId, registrationId),
          eq(playerTeams.seasonId, activeSeason[0].id)
        ));

      // Verify team 3
      playerTeamQuery = await db.select().from(playerTeams)
        .where(and(
          eq(playerTeams.registrationId, registrationId),
          eq(playerTeams.seasonId, activeSeason[0].id)
        ))
        .limit(1);

      expect(playerTeamQuery[0].teamId).toBe(3);

      // Clean up
      await db.delete(playerTeams)
        .where(eq(playerTeams.registrationId, registrationId));
      await db.delete(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail));
    });
  });
});
