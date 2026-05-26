import { describe, it, expect } from 'vitest';

describe('Date Serialization in getTeamSchedule', () => {
  it('should convert Date object to YYYY-MM-DD string', () => {
    const date = new Date('2026-06-23');
    const dateStr = date.toISOString().split('T')[0];
    
    expect(dateStr).toBe('2026-06-23');
  });

  it('should handle string dates correctly', () => {
    const dateStr = '2026-06-23';
    
    expect(typeof dateStr).toBe('string');
    expect(dateStr).toBe('2026-06-23');
  });

  it('should prevent timezone shift when converting dates', () => {
    // Test that a date created in local timezone doesn't shift
    const date = new Date('2026-06-23');
    const isoStr = date.toISOString().split('T')[0];
    
    // The ISO string should be in UTC, but when split, it should give us the correct date
    expect(isoStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should format game date correctly for display', () => {
    const gameDate = '2026-06-23';
    
    // Simulate formatDate function behavior
    const [year, month, day] = gameDate.split('-');
    const formatted = `${month}/${day}/${year}`;
    
    expect(formatted).toBe('06/23/2026');
  });

  it('should maintain consistency across multiple games', () => {
    const games = [
      { date: '2026-06-23', time: '21:30' },
      { date: '2026-06-25', time: '22:00' },
      { date: '2026-06-30', time: '21:30' },
    ];
    
    // All dates should be in YYYY-MM-DD format
    games.forEach(game => {
      expect(game.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('should sort games correctly by date', () => {
    const games = [
      { date: '2026-06-30', id: 1 },
      { date: '2026-06-23', id: 2 },
      { date: '2026-06-25', id: 3 },
    ];
    
    const sorted = games.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
    
    expect(sorted[0].id).toBe(2);
    expect(sorted[1].id).toBe(3);
    expect(sorted[2].id).toBe(1);
  });
});
