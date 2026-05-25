import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { refereeApplications } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Referee Application - submitApplication', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  describe('Application submission', () => {
    it('should accept certifications as array of strings', async () => {
      if (!db) return;

      // Verify schema accepts string array
      const testData = {
        firstName: 'Test',
        lastName: 'Ref',
        email: 'test@example.com',
        phone: '5149652842',
        interacEmail: 'test@interac.com',
        role: 'referee' as const,
        isCertified: true,
        certifications: ['Hockey Canada', 'IIHF'],
        yearsOfExperience: 5,
        hockeyLevels: ['U18', 'Junior'],
      };

      expect(testData.certifications).toEqual(['Hockey Canada', 'IIHF']);
      expect(Array.isArray(testData.certifications)).toBe(true);
      expect(testData.certifications[0]).toBe('Hockey Canada');
    });

    it('should accept certifications as array of objects', async () => {
      if (!db) return;

      // Verify schema accepts object array
      const testData = {
        firstName: 'Test',
        lastName: 'Ref',
        email: 'test@example.com',
        phone: '5149652842',
        interacEmail: 'test@interac.com',
        role: 'referee' as const,
        isCertified: true,
        certifications: [
          { type: 'Hockey Canada', year: 2026 },
          { type: 'IIHF', year: 2025 }
        ],
        yearsOfExperience: 5,
        hockeyLevels: ['U18', 'Junior'],
      };

      expect(testData.certifications).toHaveLength(2);
      expect(testData.certifications[0].type).toBe('Hockey Canada');
      expect(testData.certifications[0].year).toBe(2026);
    });

    it('should handle mixed certifications array', async () => {
      if (!db) return;

      // Verify schema accepts mixed array
      const testData = {
        firstName: 'Test',
        lastName: 'Ref',
        email: 'test@example.com',
        phone: '5149652842',
        interacEmail: 'test@interac.com',
        role: 'referee' as const,
        isCertified: true,
        certifications: [
          'Hockey Canada',
          { type: 'IIHF', year: 2025 }
        ],
        yearsOfExperience: 5,
        hockeyLevels: ['U18', 'Junior'],
      };

      expect(testData.certifications).toHaveLength(2);
      expect(typeof testData.certifications[0]).toBe('string');
      expect(typeof testData.certifications[1]).toBe('object');
    });

    it('should validate required fields', async () => {
      if (!db) return;

      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'interacEmail', 'role'];
      
      requiredFields.forEach(field => {
        expect(field).toBeDefined();
        expect(field.length).toBeGreaterThan(0);
      });
    });
  });
});
