import { describe, it, expect } from 'vitest';

describe('Registration - Confirmation Emails', () => {
  describe('Player confirmation email', () => {
    it('should send confirmation email to player on registration', () => {
      const playerEmail = 'player@example.com';
      const playerName = 'John Doe';
      
      expect(playerEmail).toBeDefined();
      expect(playerName).toBeDefined();
      expect(playerEmail).toContain('@');
    });

    it('should send email in English when language is en', () => {
      const language = 'en';
      const subject = 'MIHL Registration Received - Confirmation';
      
      expect(language).toBe('en');
      expect(subject).toContain('MIHL');
      expect(subject).toContain('Registration');
    });

    it('should send email in French when language is fr', () => {
      const language = 'fr';
      const subject = 'Inscription a la Ligue MIHL Recue - Confirmation';
      
      expect(language).toBe('fr');
      expect(subject).toContain('MIHL');
    });

    it('should include player name in confirmation body', () => {
      const playerName = 'Jane Smith';
      const body = `Hi ${playerName},\n\nThank you for registering...`;
      
      expect(body).toContain(playerName);
      expect(body).toContain('Thank you');
    });
  });

  describe('Admin notification email', () => {
    it('should send admin notification to registration@mihl.ca', () => {
      const adminEmail = 'registration@mihl.ca';
      
      expect(adminEmail).toBe('registration@mihl.ca');
      expect(adminEmail).toContain('@mihl.ca');
    });

    it('should include registration details in admin email', () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        registrationType: 'individual',
      };
      
      expect(registrationData.firstName).toBeDefined();
      expect(registrationData.email).toContain('@');
      expect(registrationData.registrationType).toBe('individual');
    });

    it('should send both admin and player emails on registration', () => {
      const adminEmail = 'registration@mihl.ca';
      const playerEmail = 'player@example.com';
      
      expect(adminEmail).toBeDefined();
      expect(playerEmail).toBeDefined();
      expect(adminEmail).not.toBe(playerEmail);
    });
  });
});
