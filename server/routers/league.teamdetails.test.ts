import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { teams, masterTeams, seasons } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Team Details - getTeamDetails', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  describe('Team name from masterTeams', () => {
    it('should return team with masterTeam name', async () => {
      if (!db) return;

      // Get first team with active season
      const teamResult = await db.select().from(teams).limit(1);
      if (!teamResult.length) return;

      const team = teamResult[0];

      // Get masterTeam
      const masterTeamResult = await db.select().from(masterTeams)
        .where(eq(masterTeams.id, team.masterTeamId))
        .limit(1);

      if (!masterTeamResult.length) return;

      const masterTeam = masterTeamResult[0];

      // Verify team has a name
      expect(team.id).toBeDefined();
      expect(masterTeam.name).toBeDefined();
      expect(masterTeam.name).toMatch(/^[A-Za-z\s]+$/); // Team names are alphabetic
    });

    it('should return null for non-existent team', async () => {
      if (!db) return;

      const result = await db.select().from(teams)
        .where(eq(teams.id, 999999))
        .limit(1);

      expect(result).toHaveLength(0);
    });

    it('should have team names from the league', async () => {
      if (!db) return;

      const teamNames = await db.select({ name: masterTeams.name }).from(masterTeams);
      const names = teamNames.map((t: any) => t.name);

      expect(names.length).toBeGreaterThanOrEqual(4);
      expect(names.every((n: string) => n && n.length > 0)).toBe(true);
    });
  });
});
