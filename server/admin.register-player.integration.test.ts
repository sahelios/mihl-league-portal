import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as db from './db';
import { generateLoginToken, validateLoginToken, markTokenAsUsed, createAdminRegisteredPlayer } from './_core/adminRegistrationService';
import { sendAdminRegistrationEmail } from './_core/emailService';
import { playerRegistrations, loginTokens, adminRegisteredPlayers } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe.skip('Admin Register Player - Integration Tests', () => {
  let testRegistrationId: number;
  let testToken: string;
  const testEmail = 'integration-test@example.com';
  const testSeasonStartDate = new Date('2026-07-01');

  describe('Full Registration Flow', () => {
    it('should complete full admin registration workflow', async () => {
      // Step 1: Create a test player registration
      const result = await db.insert(playerRegistrations).values({
        firstName: 'Integration',
        lastName: 'Test',
        email: testEmail,
        phone: '555-0001',
        teamId: 1,
        seasonId: 1,
        isFirstTime: true,
        registrationType: 'admin',
        status: 'pending',
        position: 'forward',
        playerRating: 8,
      });

      expect(result).toBeDefined();
      const registrationId = result[0].insertId;
      testRegistrationId = Number(registrationId);

      // Step 2: Create admin-registered player record
      await createAdminRegisteredPlayer(testRegistrationId);

      // Verify record was created
      const adminRecord = await db.select().from(adminRegisteredPlayers).where(eq(adminRegisteredPlayers.registrationId, testRegistrationId));
      expect(adminRecord.length).toBe(1);
      expect(adminRecord[0].passwordSet).toBe(false);
      expect(adminRecord[0].profileCompleted).toBe(false);

      // Step 3: Generate magic link token
      testToken = await generateLoginToken(testRegistrationId, testSeasonStartDate);
      expect(testToken).toBeDefined();
      expect(testToken.length).toBeGreaterThan(32);

      // Verify token was stored in database
      const tokenRecord = await db.select().from(loginTokens).where(eq(loginTokens.token, testToken));
      expect(tokenRecord.length).toBe(1);
      expect(tokenRecord[0].registrationId).toBe(testRegistrationId);
      expect(tokenRecord[0].usedAt).toBeNull();

      // Step 4: Validate token before use
      let validatedRegistrationId = await validateLoginToken(testToken);
      expect(validatedRegistrationId).toBe(testRegistrationId);

      // Step 5: Mark token as used (simulating login)
      await markTokenAsUsed(testToken);

      // Step 6: Verify token cannot be reused
      validatedRegistrationId = await validateLoginToken(testToken);
      expect(validatedRegistrationId).toBeNull();

      // Verify token was marked as used in database
      const usedTokenRecord = await db.select().from(loginTokens).where(eq(loginTokens.token, testToken));
      expect(usedTokenRecord.length).toBe(1);
      expect(usedTokenRecord[0].usedAt).not.toBeNull();
    });

    it('should handle token expiration correctly', async () => {
      // Create player registration
      const result = await db.insert(playerRegistrations).values({
        firstName: 'Expiration',
        lastName: 'Test',
        email: 'expiration-test@example.com',
        phone: '555-0002',
        teamId: 1,
        seasonId: 1,
        isFirstTime: true,
        registrationType: 'admin',
        status: 'pending',
      });

      const registrationId = Number(result[0].insertId);

      // Create admin-registered player
      await createAdminRegisteredPlayer(registrationId);

      // Generate token with past expiration date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const expiredToken = await generateLoginToken(registrationId, pastDate);

      // Token should be invalid
      const validationResult = await validateLoginToken(expiredToken);
      expect(validationResult).toBeNull();
    });

    it('should generate unique tokens for different registrations', async () => {
      // Create two player registrations
      const result1 = await db.insert(playerRegistrations).values({
        firstName: 'Unique',
        lastName: 'Test1',
        email: 'unique-test1@example.com',
        phone: '555-0003',
        teamId: 1,
        seasonId: 1,
        isFirstTime: true,
        registrationType: 'admin',
        status: 'pending',
      });

      const result2 = await db.insert(playerRegistrations).values({
        firstName: 'Unique',
        lastName: 'Test2',
        email: 'unique-test2@example.com',
        phone: '555-0004',
        teamId: 1,
        seasonId: 1,
        isFirstTime: true,
        registrationType: 'admin',
        status: 'pending',
      });

      const registrationId1 = Number(result1[0].insertId);
      const registrationId2 = Number(result2[0].insertId);

      // Create admin-registered players
      await createAdminRegisteredPlayer(registrationId1);
      await createAdminRegisteredPlayer(registrationId2);

      // Generate tokens
      const token1 = await generateLoginToken(registrationId1, testSeasonStartDate);
      const token2 = await generateLoginToken(registrationId2, testSeasonStartDate);

      // Tokens should be different
      expect(token1).not.toBe(token2);

      // Each token should validate to its own registration
      expect(await validateLoginToken(token1)).toBe(registrationId1);
      expect(await validateLoginToken(token2)).toBe(registrationId2);
    });

    it('should handle email sending', async () => {
      const result = await sendAdminRegistrationEmail(
        'email-test@example.com',
        'Email Test Player',
        'https://mihl.ca/magic-login?token=test123456789abcdef',
        'en'
      );

      // Email service should return a result
      expect(result).toBeDefined();
    });

    it('should handle bilingual email sending', async () => {
      // Test English email
      const resultEn = await sendAdminRegistrationEmail(
        'bilingual-test@example.com',
        'Bilingual Test',
        'https://mihl.ca/magic-login?token=test123',
        'en'
      );
      expect(resultEn).toBeDefined();

      // Test French email
      const resultFr = await sendAdminRegistrationEmail(
        'bilingual-test@example.com',
        'Test Bilingue',
        'https://mihl.ca/magic-login?token=test123',
        'fr'
      );
      expect(resultFr).toBeDefined();
    });
  });

  describe('Database Integrity', () => {
    it('should maintain referential integrity', async () => {
      // Create player registration
      const result = await db.insert(playerRegistrations).values({
        firstName: 'Integrity',
        lastName: 'Test',
        email: 'integrity-test@example.com',
        phone: '555-0005',
        teamId: 1,
        seasonId: 1,
        isFirstTime: true,
        registrationType: 'admin',
        status: 'pending',
      });

      const registrationId = Number(result[0].insertId);

      // Create admin-registered player
      await createAdminRegisteredPlayer(registrationId);

      // Generate token
      const token = await generateLoginToken(registrationId, testSeasonStartDate);

      // Verify all records exist
      const playerRecord = await db.select().from(playerRegistrations).where(eq(playerRegistrations.id, registrationId));
      const adminRecord = await db.select().from(adminRegisteredPlayers).where(eq(adminRegisteredPlayers.registrationId, registrationId));
      const tokenRecord = await db.select().from(loginTokens).where(eq(loginTokens.token, token));

      expect(playerRecord.length).toBe(1);
      expect(adminRecord.length).toBe(1);
      expect(tokenRecord.length).toBe(1);

      // Verify relationships
      expect(adminRecord[0].registrationId).toBe(registrationId);
      expect(tokenRecord[0].registrationId).toBe(registrationId);
    });

    it('should handle multiple tokens per registration', async () => {
      // Create player registration
      const result = await db.insert(playerRegistrations).values({
        firstName: 'MultiToken',
        lastName: 'Test',
        email: 'multitoken-test@example.com',
        phone: '555-0006',
        teamId: 1,
        seasonId: 1,
        isFirstTime: true,
        registrationType: 'admin',
        status: 'pending',
      });

      const registrationId = Number(result[0].insertId);

      // Create admin-registered player
      await createAdminRegisteredPlayer(registrationId);

      // Generate multiple tokens
      const token1 = await generateLoginToken(registrationId, testSeasonStartDate);
      const token2 = await generateLoginToken(registrationId, testSeasonStartDate);

      // Both tokens should be valid initially
      expect(await validateLoginToken(token1)).toBe(registrationId);
      expect(await validateLoginToken(token2)).toBe(registrationId);

      // Mark first token as used
      await markTokenAsUsed(token1);

      // First token should be invalid, second should still be valid
      expect(await validateLoginToken(token1)).toBeNull();
      expect(await validateLoginToken(token2)).toBe(registrationId);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tokens gracefully', async () => {
      const invalidToken = 'invalid-token-that-does-not-exist-in-database';
      const result = await validateLoginToken(invalidToken);
      expect(result).toBeNull();
    });

    it('should handle non-existent registration IDs', async () => {
      const nonExistentId = 999999;
      // This should not throw, but create a token that won't validate
      const token = await generateLoginToken(nonExistentId, testSeasonStartDate);
      expect(token).toBeDefined();

      // Token should validate to the ID (database doesn't enforce FK at this level)
      const result = await validateLoginToken(token);
      expect(result).toBe(nonExistentId);
    });
  });
});
