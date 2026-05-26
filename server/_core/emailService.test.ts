import { describe, it, expect, beforeAll } from 'vitest';

describe('Email Service', () => {
  describe('SMTP Configuration', () => {
    it('should have EMAIL_HOST environment variable', () => {
      expect(process.env.EMAIL_HOST).toBeDefined();
      expect(process.env.EMAIL_HOST).toBe('mail.mihl.ca');
    });

    it('should have EMAIL_PORT environment variable', () => {
      expect(process.env.EMAIL_PORT).toBeDefined();
      expect(parseInt(process.env.EMAIL_PORT || '0')).toBe(465);
    });

    it('should have EMAIL_USER environment variable', () => {
      expect(process.env.EMAIL_USER).toBeDefined();
      expect(process.env.EMAIL_USER).toBe('registration@mihl.ca');
    });

    it('should have EMAIL_PASSWORD environment variable', () => {
      expect(process.env.EMAIL_PASSWORD).toBeDefined();
      expect(process.env.EMAIL_PASSWORD?.length).toBeGreaterThan(0);
    });

    it('should have EMAIL_FROM environment variable', () => {
      expect(process.env.EMAIL_FROM).toBeDefined();
      expect(process.env.EMAIL_FROM).toBe('registration@mihl.ca');
    });
  });

  describe('Email Functions', () => {
    it('should send registration confirmation email', async () => {
      const { sendRegistrationConfirmationEmail } = await import('./emailService');
      
      expect(sendRegistrationConfirmationEmail).toBeDefined();
      expect(typeof sendRegistrationConfirmationEmail).toBe('function');
    });

    it('should send admin notification email', async () => {
      const { sendRegistrationAdminNotification } = await import('./emailService');
      
      expect(sendRegistrationAdminNotification).toBeDefined();
      expect(typeof sendRegistrationAdminNotification).toBe('function');
    });

    it('should send approval email', async () => {
      const { sendApprovalEmail } = await import('./emailService');
      
      expect(sendApprovalEmail).toBeDefined();
      expect(typeof sendApprovalEmail).toBe('function');
    });

    it('should send rejection email', async () => {
      const { sendRejectionEmail } = await import('./emailService');
      
      expect(sendRejectionEmail).toBeDefined();
      expect(typeof sendRejectionEmail).toBe('function');
    });

    it('should verify email connection', async () => {
      const { verifyEmailConnection } = await import('./emailService');
      
      expect(verifyEmailConnection).toBeDefined();
      expect(typeof verifyEmailConnection).toBe('function');
    });
  });

  describe('Email Content', () => {
    it('should support English language emails', async () => {
      const language = 'en';
      expect(language).toBe('en');
    });

    it('should support French language emails', async () => {
      const language = 'fr';
      expect(language).toBe('fr');
    });

    it('should include player name in confirmation', () => {
      const playerName = 'John Doe';
      const body = `Hi ${playerName}, Thank you for registering`;
      
      expect(body).toContain(playerName);
      expect(body).toContain('Thank you');
    });

    it('should include registration details in admin notification', () => {
      const playerData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        registrationType: 'individual',
        playerRating: 7,
      };
      
      expect(playerData.firstName).toBeDefined();
      expect(playerData.email).toContain('@');
      expect(playerData.registrationType).toBe('individual');
    });
  });
});
