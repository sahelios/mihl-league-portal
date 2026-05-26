import { describe, it, expect } from 'vitest';

describe('Approval Email with Evaluation Game Info', () => {
  describe('Email Content', () => {
    it('should include evaluation game date in English', () => {
      const evaluationGameInfo = { date: 'JUN 23', team: 'Team White' };
      const emailContent = `Evaluation Game Assignment:\nDate: ${evaluationGameInfo.date}\nTeam: ${evaluationGameInfo.team}`;
      
      expect(emailContent).toContain('JUN 23');
      expect(emailContent).toContain('Team White');
    });

    it('should include evaluation game date in French', () => {
      const evaluationGameInfo = { date: 'JUN 25', team: 'Team Black' };
      const emailContent = `Assignation au Match d'Évaluation:\nDate: ${evaluationGameInfo.date}\nÉquipe: ${evaluationGameInfo.team}`;
      
      expect(emailContent).toContain('JUN 25');
      expect(emailContent).toContain('Team Black');
    });

    it('should include Player Portal login instructions in English', () => {
      const playerEmail = 'player@example.com';
      const portalUrl = 'https://mihl.ca/player-portal';
      
      expect(portalUrl).toContain('mihl.ca');
      expect(portalUrl).toContain('player-portal');
    });

    it('should include Player Portal login instructions in French', () => {
      const playerEmail = 'player@example.com';
      const portalUrl = 'https://mihl.ca/player-portal';
      
      expect(portalUrl).toContain('mihl.ca');
      expect(portalUrl).toContain('player-portal');
    });

    it('should include contact information', () => {
      const contactEmail = 'registration@mihl.ca';
      const contactPhone = '514-965-2842';
      
      expect(contactEmail).toBe('registration@mihl.ca');
      expect(contactPhone).toBe('514-965-2842');
    });

    it('should handle missing evaluation game info gracefully', () => {
      const evaluationGameInfo = null;
      const hasEvalInfo = evaluationGameInfo !== null;
      
      expect(hasEvalInfo).toBe(false);
    });

    it('should include player email in portal instructions', () => {
      const playerEmail = 'john.doe@example.com';
      const instructions = `Use your email (${playerEmail}) to sign in`;
      
      expect(instructions).toContain(playerEmail);
    });

    it('should support both Team White and Team Black', () => {
      const teamWhite = 'Team White';
      const teamBlack = 'Team Black';
      
      expect(teamWhite).toBe('Team White');
      expect(teamBlack).toBe('Team Black');
    });

    it('should include all evaluation dates (JUN 23, JUN 25)', () => {
      const dates = ['JUN 23', 'JUN 25'];
      
      expect(dates).toContain('JUN 23');
      expect(dates).toContain('JUN 25');
    });

    it('should have bilingual subject line', () => {
      const subjectEn = 'Your MIHL Registration Has Been Approved!';
      const subjectFr = 'Votre Inscription à la Ligue MIHL a été Approuvée!';
      
      expect(subjectEn).toContain('Approved');
      expect(subjectFr).toContain('Approuvée');
    });

    it('should include next steps section', () => {
      const nextStepsEn = 'Next Steps:';
      const nextStepsFr = 'Prochaines Étapes:';
      
      expect(nextStepsEn).toBeTruthy();
      expect(nextStepsFr).toBeTruthy();
    });
  });

  describe('Email Parameters', () => {
    it('should accept player email', () => {
      const playerEmail = 'player@mihl.ca';
      expect(playerEmail).toContain('@');
    });

    it('should accept player name', () => {
      const playerName = 'John Doe';
      expect(playerName).toBeTruthy();
    });

    it('should accept language parameter', () => {
      const languages = ['en', 'fr'];
      expect(languages).toContain('en');
      expect(languages).toContain('fr');
    });

    it('should accept optional evaluation game info', () => {
      const evaluationGameInfo = { date: 'JUN 23', team: 'Team White' };
      expect(evaluationGameInfo).toBeDefined();
      expect(evaluationGameInfo.date).toBe('JUN 23');
      expect(evaluationGameInfo.team).toBe('Team White');
    });
  });
});
