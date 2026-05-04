import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { adminRouter } from './admin'; // Adjust import based on actual export
import { getDb } from '../db';
import { sendEmail } from '../utils/email'; // Assuming an email utility exists

// Mock dependencies
vi.mock('../db', () => ({
  getDb: vi.fn(),
}));

vi.mock('../utils/email', () => ({
  sendEmail: vi.fn(),
}));

describe('Admin Router', () => {
  let mockQuery: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock database connection and query function
    mockQuery = vi.fn();
    (getDb as any).mockResolvedValue({
      query: mockQuery,
    });
  });

  // Helper to create a tRPC caller with a specific context
  const createCaller = (role: 'admin' | 'user' | null = 'admin') => {
    const ctx = {
      user: role ? { id: 1, role, name: 'Test User', email: 'test@test.com' } : null,
    };
    return adminRouter.createCaller(ctx);
  };

  describe('Authorization', () => {
    it('should prevent non-admin access', async () => {
      const caller = createCaller('user');
      
      await expect(caller.getRegistrationStats()).rejects.toThrowError(
        new TRPCError({ code: 'FORBIDDEN' })
      );
    });

    it('should prevent unauthenticated access', async () => {
      const caller = createCaller(null);
      
      await expect(caller.getRegistrationStats()).rejects.toThrowError(
        new TRPCError({ code: 'UNAUTHORIZED' }) // Or FORBIDDEN depending on middleware
      );
    });
  });

  describe('approveRegistration', () => {
    it('should approve a pending registration', async () => {
      const caller = createCaller('admin');
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await caller.approveRegistration({ id: 123 });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE player_registrations SET status = ?'),
        ['approved', 123]
      );
      expect(result).toEqual({ success: true, message: 'Registration approved' });
    });

    it('should handle database errors gracefully', async () => {
      const caller = createCaller('admin');
      mockQuery.mockRejectedValueOnce(new Error('DB Connection Lost'));

      await expect(caller.approveRegistration({ id: 123 })).rejects.toThrowError(
        new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to approve registration' })
      );
    });
  });

  describe('rejectRegistration', () => {
    it('should reject a registration with reason', async () => {
      const caller = createCaller('admin');
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await caller.rejectRegistration({ 
        id: 123, 
        reason: 'Division is currently full' 
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE player_registrations SET status = ?'),
        ['rejected', 123]
      );
      // Optional: Check if the reason was logged/saved or if an email was triggered
      expect(sendEmail).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('Registration Update'),
        expect.stringContaining('Division is currently full')
      );
      expect(result).toEqual({ success: true, message: 'Registration rejected' });
    });
  });

  describe('markPaymentPaid', () => {
    it('should mark payment as paid', async () => {
      const caller = createCaller('admin');
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await caller.markPaymentPaid({ id: 456 });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE player_registrations SET paymentStatus = ?'),
        ['paid', 456]
      );
      expect(result).toEqual({ success: true, message: 'Payment marked as paid' });
    });

    it('should throw an error if the record does not exist', async () => {
      const caller = createCaller('admin');
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]); // No rows updated

      await expect(caller.markPaymentPaid({ id: 999 })).rejects.toThrowError(
        new TRPCError({ code: 'NOT_FOUND', message: 'Registration not found' })
      );
    });
  });

  describe('getRegistrationStats', () => {
    it('should return correct stats', async () => {
      const caller = createCaller('admin');
      const mockDbResult = [
        { status: 'approved', count: 45 },
        { status: 'pending', count: 12 },
        { status: 'rejected', count: 3 }
      ];
      
      mockQuery.mockResolvedValueOnce([mockDbResult]);

      const result = await caller.getRegistrationStats();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT status, COUNT(*) as count FROM player_registrations GROUP BY status')
      );
      
      expect(result).toEqual({
        approved: 45,
        pending: 12,
        rejected: 3,
        total: 60
      });
    });
  });

  describe('getEvaluationAttendance', () => {
    it('should return players scheduled for a specific evaluation date', async () => {
      const caller = createCaller('admin');
      const mockPlayers = [
        { id: 1, firstName: 'John', lastName: 'Doe', position: 'forward' },
        { id: 2, firstName: 'Jane', lastName: 'Smith', position: 'defenseman' }
      ];
      
      mockQuery.mockResolvedValueOnce([mockPlayers]);

      const result = await caller.getEvaluationAttendance({ date: '2026-06-24' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, firstName, lastName, position FROM player_registrations WHERE evaluationDate = ?'),
        ['2026-06-24']
      );
      
      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe('John');
    });

    it('should return an empty array if no one is scheduled', async () => {
      const caller = createCaller('admin');
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await caller.getEvaluationAttendance({ date: '2026-06-25' });
      expect(result).toEqual([]);
    });
  });
});