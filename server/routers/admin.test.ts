import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { adminRouter } from './admin'; 
import { getDb } from '../db';
import type { TrpcContext } from '../_core/context';

// Mock database dependency[cite: 9]
vi.mock('../db', () => ({
  getDb: vi.fn(),
}));

describe('Admin Router', () => {
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock database connection and query function[cite: 9]
    mockQuery = vi.fn();
    (getDb as any).mockResolvedValue({
      query: mockQuery,
    });
  });

  // Helper to create a tRPC caller with specific context[cite: 9, 10]
  const createCaller = (role: 'admin' | 'user' | null = 'admin') => {
    const ctx = {
      user: role ? { 
        id: 1, 
        openId: "test-user", 
        email: "test@example.com", 
        name: "Test User", 
        loginMethod: "manus", 
        role, 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        lastSignedIn: new Date() 
      } : undefined,
      req: { protocol: "https", headers: {} },
      res: { clearCookie: vi.fn() }
    } as unknown as TrpcContext;
    
    return adminRouter.createCaller(ctx);
  };

  describe('Authorization Checks', () => {
    it('should prevent non-admin access across protected routes', async () => {
      const caller = createCaller('user'); // standard user[cite: 9]
      
      await expect(caller.createNewsPost({ title: 'Test', content: 'Test' }))
        .rejects.toThrowError(new TRPCError({ code: 'FORBIDDEN' }));
    });
  });

  describe('getUpcomingGames', () => {
    it('should return scheduled games (Success)', async () => {
      const caller = createCaller('admin');
      const mockGames = [{ id: 1, teamAName: 'Iron Lions', status: 'scheduled' }];
      mockQuery.mockResolvedValueOnce([mockGames]);

      const result = await caller.getUpcomingGames();
      expect(mockQuery).toHaveBeenCalled();
      expect(result).toEqual(mockGames);
    });

    it('should handle database errors', async () => {
      const caller = createCaller('admin');
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      await expect(caller.getUpcomingGames())
        .rejects.toThrowError(new TRPCError({ code: 'INTERNAL_SERVER_ERROR' }));
    });
  });

  describe('getRecentGames', () => {
    it('should return completed games (Success)', async () => {
      const caller = createCaller('admin');
      const mockGames = [{ id: 2, teamAName: 'H Hammers', status: 'completed' }];
      mockQuery.mockResolvedValueOnce([mockGames]);

      const result = await caller.getRecentGames();
      expect(result).toEqual(mockGames);
    });
  });

  describe('submitGameScore', () => {
    const validInput = { gameId: 1, teamAScore: 3, teamBScore: 2, scorers: 'Player 1', assists: 'Player 2' };

    it('should update game with score (Success)', async () => {
      const caller = createCaller('admin');
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await caller.submitGameScore(validInput);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE game_results'),
        expect.any(Array)
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw validation error for negative scores', async () => {
      const caller = createCaller('admin');
      // Zod validation throws TRPCError with BAD_REQUEST naturally
      await expect(caller.submitGameScore({ ...validInput, teamAScore: -1 }))
        .rejects.toThrow(); 
    });
  });

  describe('createNewsPost', () => {
    it('should create a news post (Success)', async () => {
      const caller = createCaller('admin');
      mockQuery.mockResolvedValueOnce([{ insertId: 1 }]);

      const result = await caller.createNewsPost({ title: 'New Rules', content: 'Details here' });
      expect(mockQuery).toHaveBeenCalled();
      expect(result).toEqual({ success: true, id: 1 });
    });
  });

  describe('deleteNewsPost', () => {
    it('should remove a post (Success)', async () => {
      const caller = createCaller('admin');
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await caller.deleteNewsPost({ id: 1 });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM news_posts'),
        [1]
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('selectStars', () => {
    it('should update stars of the week (Success)', async () => {
      const caller = createCaller('admin');
      mockQuery.mockResolvedValueOnce([{ affectedRows: 3 }]);

      const result = await caller.selectStars({ firstStarId: 1, secondStarId: 2, thirdStarId: 3, week: 1 });
      expect(result).toEqual({ success: true });
    });
  });

  describe('addSuspension', () => {
    it('should create a suspension (Success)', async () => {
      const caller = createCaller('admin');
      mockQuery.mockResolvedValueOnce([{ insertId: 1 }]);

      const result = await caller.addSuspension({ playerId: 1, reason: 'Fighting', games: 3 });
      expect(mockQuery).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('createSeason', () => {
    it('should create a new season (Success)', async () => {
      const caller = createCaller('admin');
      mockQuery.mockResolvedValueOnce([{ insertId: 1 }]);

      const result = await caller.createSeason({ name: '2027 Winter', startDate: new Date(), endDate: new Date() });
      expect(result).toEqual({ success: true, id: 1 });
    });
  });

  describe('createTeam', () => {
    it('should create a team (Success)', async () => {
      const caller = createCaller('admin');
      mockQuery.mockResolvedValueOnce([{ insertId: 1 }]);

      const result = await caller.createTeam({ name: 'New Team', primaryColor: 'Red', secondaryColor: 'White' });
      expect(result).toEqual({ success: true, id: 1 });
    });
  });

  describe('createVenue', () => {
    it('should create a venue (Success)', async () => {
      const caller = createCaller('admin');
      mockQuery.mockResolvedValueOnce([{ insertId: 1 }]);

      const result = await caller.createVenue({ name: 'Centre Bell', address: 'Montreal' });
      expect(result).toEqual({ success: true, id: 1 });
    });
  });
});