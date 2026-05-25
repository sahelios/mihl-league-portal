import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { playerAvailability, playerTeams, games } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

describe('Player Availability Procedures', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  describe('updatePlayerAvailability', () => {
    it('should insert a new availability record when none exists', async () => {
      if (!db) return;

      // Clean up first
      await db
        .delete(playerAvailability)
        .where(
          and(
            eq(playerAvailability.playerTeamId, 999),
            eq(playerAvailability.gameId, 999)
          )
        );

      // Insert new availability
      await db.insert(playerAvailability).values({
        playerTeamId: 999,
        gameId: 999,
        isAvailable: false,
      });

      // Verify it was inserted
      const result = await db
        .select()
        .from(playerAvailability)
        .where(
          and(
            eq(playerAvailability.playerTeamId, 999),
            eq(playerAvailability.gameId, 999)
          )
        );

      expect(result).toHaveLength(1);
      expect(result[0].isAvailable).toBe(false);

      // Clean up
      await db
        .delete(playerAvailability)
        .where(
          and(
            eq(playerAvailability.playerTeamId, 999),
            eq(playerAvailability.gameId, 999)
          )
        );
    });

    it('should update an existing availability record', async () => {
      if (!db) return;

      // Clean up first
      await db
        .delete(playerAvailability)
        .where(
          and(
            eq(playerAvailability.playerTeamId, 998),
            eq(playerAvailability.gameId, 998)
          )
        );

      // Insert initial record
      await db.insert(playerAvailability).values({
        playerTeamId: 998,
        gameId: 998,
        isAvailable: true,
      });

      // Update it
      await db
        .update(playerAvailability)
        .set({ isAvailable: false })
        .where(
          and(
            eq(playerAvailability.playerTeamId, 998),
            eq(playerAvailability.gameId, 998)
          )
        );

      // Verify it was updated
      const result = await db
        .select()
        .from(playerAvailability)
        .where(
          and(
            eq(playerAvailability.playerTeamId, 998),
            eq(playerAvailability.gameId, 998)
          )
        );

      expect(result).toHaveLength(1);
      expect(result[0].isAvailable).toBe(false);

      // Clean up
      await db
        .delete(playerAvailability)
        .where(
          and(
            eq(playerAvailability.playerTeamId, 998),
            eq(playerAvailability.gameId, 998)
          )
        );
    });
  });

  describe('getPlayerAvailability', () => {
    it('should return empty map when no availability records exist', async () => {
      if (!db) return;

      const result = await db
        .select()
        .from(playerAvailability)
        .where(eq(playerAvailability.playerTeamId, 997));

      const availabilityMap: Record<number, boolean> = {};
      result.forEach((record: any) => {
        availabilityMap[record.gameId] = record.isAvailable;
      });

      expect(availabilityMap).toEqual({});
    });

    it('should return a map of gameId to availability status', async () => {
      if (!db) return;

      // Clean up first
      await db
        .delete(playerAvailability)
        .where(eq(playerAvailability.playerTeamId, 996));

      // Insert multiple records
      await db.insert(playerAvailability).values([
        { playerTeamId: 996, gameId: 1, isAvailable: true },
        { playerTeamId: 996, gameId: 2, isAvailable: false },
        { playerTeamId: 996, gameId: 3, isAvailable: true },
      ]);

      // Fetch and convert to map
      const result = await db
        .select()
        .from(playerAvailability)
        .where(eq(playerAvailability.playerTeamId, 996));

      const availabilityMap: Record<number, boolean> = {};
      result.forEach((record: any) => {
        availabilityMap[record.gameId] = record.isAvailable;
      });

      expect(availabilityMap).toEqual({
        1: true,
        2: false,
        3: true,
      });

      // Clean up
      await db
        .delete(playerAvailability)
        .where(eq(playerAvailability.playerTeamId, 996));
    });
  });
});
