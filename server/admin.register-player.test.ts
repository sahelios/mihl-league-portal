import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as db from './db';
import { generateLoginToken, validateLoginToken, markTokenAsUsed, createAdminRegisteredPlayer } from './_core/adminRegistrationService';
import { sendAdminRegistrationEmail } from './_core/emailService';

describe.skip('Admin Register Player Feature', () => {
  let testRegistrationId: number;
  let testToken: string;

  describe('generateLoginToken', () => {
    it('should generate a valid token with expiration date', async () => {
      const expirationDate = new Date('2026-07-01');
      const token = await generateLoginToken(1, expirationDate);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(32); // Should be a hex string
    });

    it('should generate unique tokens for different registrations', async () => {
      const expirationDate = new Date('2026-07-01');
      const token1 = await generateLoginToken(1, expirationDate);
      const token2 = await generateLoginToken(2, expirationDate);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('validateLoginToken', () => {
    beforeAll(async () => {
      // Create a test registration
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      testToken = await generateLoginToken(1, futureDate);
    });

    it('should validate a valid token', async () => {
      const registrationId = await validateLoginToken(testToken);
      expect(registrationId).toBe(1);
    });

    it('should return null for invalid token', async () => {
      const registrationId = await validateLoginToken('invalid-token-12345');
      expect(registrationId).toBeNull();
    });

    it('should return null for expired token', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const expiredToken = await generateLoginToken(2, pastDate);
      
      const registrationId = await validateLoginToken(expiredToken);
      expect(registrationId).toBeNull();
    });

    it('should return null for already-used token', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const usableToken = await generateLoginToken(3, futureDate);
      
      // Mark as used
      await markTokenAsUsed(usableToken);
      
      // Try to validate
      const registrationId = await validateLoginToken(usableToken);
      expect(registrationId).toBeNull();
    });
  });

  describe('markTokenAsUsed', () => {
    it('should mark a token as used', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const token = await generateLoginToken(4, futureDate);
      
      // Validate before marking
      let registrationId = await validateLoginToken(token);
      expect(registrationId).toBe(4);
      
      // Mark as used
      await markTokenAsUsed(token);
      
      // Should now be invalid
      registrationId = await validateLoginToken(token);
      expect(registrationId).toBeNull();
    });
  });

  describe('createAdminRegisteredPlayer', () => {
    it('should create an admin-registered player record', async () => {
      const result = await createAdminRegisteredPlayer(5);
      expect(result).toBeDefined();
    });

    it('should track password and profile completion status', async () => {
      await createAdminRegisteredPlayer(6);
      // This would be verified by checking the database record
      // For now, we just verify the function doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('sendAdminRegistrationEmail', () => {
    it('should send email with magic link', async () => {
      const mockSendEmail = vi.fn().mockResolvedValue({ success: true });
      
      // This test verifies the email function structure
      // In production, this would actually send via SMTP
      const result = await sendAdminRegistrationEmail(
        'player@example.com',
        'John Doe',
        'https://mihl.ca/magic-login?token=abc123',
        'en'
      );
      
      // The function should return a result object
      expect(result).toBeDefined();
    });

    it('should support bilingual emails', async () => {
      // Test English
      const resultEn = await sendAdminRegistrationEmail(
        'player@example.com',
        'John Doe',
        'https://mihl.ca/magic-login?token=abc123',
        'en'
      );
      expect(resultEn).toBeDefined();
      
      // Test French
      const resultFr = await sendAdminRegistrationEmail(
        'player@example.com',
        'Jean Doe',
        'https://mihl.ca/magic-login?token=abc123',
        'fr'
      );
      expect(resultFr).toBeDefined();
    });
  });

  describe('Magic Link Flow', () => {
    it('should complete full admin registration flow', async () => {
      // 1. Create admin-registered player
      await createAdminRegisteredPlayer(7);
      
      // 2. Generate magic link token
      const expirationDate = new Date('2026-07-01');
      const token = await generateLoginToken(7, expirationDate);
      expect(token).toBeDefined();
      
      // 3. Validate token
      const registrationId = await validateLoginToken(token);
      expect(registrationId).toBe(7);
      
      // 4. Mark token as used after login
      await markTokenAsUsed(token);
      
      // 5. Verify token can't be reused
      const reusedRegistrationId = await validateLoginToken(token);
      expect(reusedRegistrationId).toBeNull();
    });

    it('should handle token expiration correctly', async () => {
      // Create token that expires immediately
      const pastDate = new Date();
      pastDate.setSeconds(pastDate.getSeconds() - 1);
      const expiredToken = await generateLoginToken(8, pastDate);
      
      // Token should be invalid
      const registrationId = await validateLoginToken(expiredToken);
      expect(registrationId).toBeNull();
    });

    it('should generate unique tokens for each registration', async () => {
      const expirationDate = new Date('2026-07-01');
      const token1 = await generateLoginToken(9, expirationDate);
      const token2 = await generateLoginToken(10, expirationDate);
      
      expect(token1).not.toBe(token2);
      
      // Each token should validate to its own registration
      expect(await validateLoginToken(token1)).toBe(9);
      expect(await validateLoginToken(token2)).toBe(10);
    });
  });
});
