import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { playerRegistrations } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Registration Submit - Position Handling', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  describe('Position storage during registration', () => {
    it('should save position when provided during registration', async () => {
      if (!db) return;

      // Create a test registration with position
      const testEmail = `test-pos-reg-${Date.now()}@example.com`;
      await db.insert(playerRegistrations).values({
        firstName: 'Test',
        lastName: 'Forward',
        email: testEmail,
        phone: '1234567890',
        registrationType: 'individual',
        status: 'pending',
        seasonId: 30001,
        teamId: 1,
        isFirstTime: false,
        paymentConfirmed: false,
        jerseyOrderConfirmed: false,
        position: 'forward',
      });

      // Retrieve and verify
      const result = await db.select().from(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0].position).toBe('forward');

      // Clean up
      await db.delete(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail));
    });

    it('should save position as defense', async () => {
      if (!db) return;

      const testEmail = `test-def-reg-${Date.now()}@example.com`;
      await db.insert(playerRegistrations).values({
        firstName: 'Test',
        lastName: 'Defense',
        email: testEmail,
        phone: '1234567890',
        registrationType: 'individual',
        status: 'pending',
        seasonId: 30001,
        teamId: 1,
        isFirstTime: false,
        paymentConfirmed: false,
        jerseyOrderConfirmed: false,
        position: 'defense',
      });

      const result = await db.select().from(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0].position).toBe('defense');

      // Clean up
      await db.delete(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail));
    });

    it('should save position as goalie', async () => {
      if (!db) return;

      const testEmail = `test-goal-reg-${Date.now()}@example.com`;
      await db.insert(playerRegistrations).values({
        firstName: 'Test',
        lastName: 'Goalie',
        email: testEmail,
        phone: '1234567890',
        registrationType: 'individual',
        status: 'pending',
        seasonId: 30001,
        teamId: 1,
        isFirstTime: false,
        paymentConfirmed: false,
        jerseyOrderConfirmed: false,
        position: 'goalie',
      });

      const result = await db.select().from(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0].position).toBe('goalie');

      // Clean up
      await db.delete(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail));
    });

    it('should allow null position if not provided', async () => {
      if (!db) return;

      const testEmail = `test-no-pos-reg-${Date.now()}@example.com`;
      await db.insert(playerRegistrations).values({
        firstName: 'Test',
        lastName: 'NoPosition',
        email: testEmail,
        phone: '1234567890',
        registrationType: 'individual',
        status: 'pending',
        seasonId: 30001,
        teamId: 1,
        isFirstTime: false,
        paymentConfirmed: false,
        jerseyOrderConfirmed: false,
        position: null,
      });

      const result = await db.select().from(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0].position).toBeNull();

      // Clean up
      await db.delete(playerRegistrations)
        .where(eq(playerRegistrations.email, testEmail));
    });
  });
});
