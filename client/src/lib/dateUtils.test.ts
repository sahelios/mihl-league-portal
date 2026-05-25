import { describe, it, expect } from 'vitest';
import {
  parseLocalDate,
  getDateOnly,
  formatDate,
  formatTime,
  formatDateTime,
  getISOWeekKey,
  compareDates,
  isToday,
  isFuture,
  isPast,
} from './dateUtils';

describe('dateUtils', () => {
  describe('parseLocalDate', () => {
    it('parses YYYY-MM-DD as local date', () => {
      const date = parseLocalDate('2026-06-23');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(5); // June is month 5 (0-indexed)
      expect(date.getDate()).toBe(23);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
    });

    it('handles single-digit months and days', () => {
      const date = parseLocalDate('2026-06-05');
      expect(date.getMonth()).toBe(5);
      expect(date.getDate()).toBe(5);
    });
  });

  describe('getDateOnly', () => {
    it('extracts date from ISO string', () => {
      expect(getDateOnly('2026-06-23T12:00:00Z')).toBe('2026-06-23');
    });

    it('returns date string as-is if already in YYYY-MM-DD format', () => {
      expect(getDateOnly('2026-06-23')).toBe('2026-06-23');
    });

    it('converts Date object to YYYY-MM-DD', () => {
      const date = new Date(2026, 5, 23); // June 23, 2026
      const result = getDateOnly(date);
      expect(result).toMatch(/2026-06-23/);
    });
  });

  describe('formatDate', () => {
    it('formats date string to readable format', () => {
      const result = formatDate('2026-06-23');
      expect(result).toContain('Jun');
      expect(result).toContain('23');
      expect(result).toContain('2026');
    });

    it('formats Date object to readable format', () => {
      const date = parseLocalDate('2026-06-23');
      const result = formatDate(date);
      expect(result).toContain('Jun');
      expect(result).toContain('23');
      expect(result).toContain('2026');
    });

    it('strips time component from ISO strings', () => {
      const result = formatDate('2026-06-23T12:00:00Z');
      expect(result).toContain('Jun');
      expect(result).toContain('23');
    });
  });

  describe('formatTime', () => {
    it('converts 24-hour to 12-hour AM/PM format', () => {
      expect(formatTime('09:30')).toBe('9:30 AM');
      expect(formatTime('21:30')).toBe('9:30 PM');
    });

    it('handles midnight and noon', () => {
      expect(formatTime('00:00')).toBe('12:00 AM');
      expect(formatTime('12:00')).toBe('12:00 PM');
    });

    it('handles single-digit hours', () => {
      expect(formatTime('09:00')).toBe('9:00 AM');
    });
  });

  describe('formatDateTime', () => {
    it('combines date and time formatting', () => {
      const result = formatDateTime('2026-06-23', '21:30');
      expect(result).toContain('Jun');
      expect(result).toContain('23');
      expect(result).toContain('9:30 PM');
      expect(result).toContain('·');
    });
  });

  describe('getISOWeekKey', () => {
    it('returns ISO week key for a date', () => {
      const result = getISOWeekKey('2026-06-23');
      expect(result).toMatch(/2026-W\d+/);
    });

    it('groups dates in the same week with same key', () => {
      // June 22-28, 2026 should be in the same ISO week
      const key1 = getISOWeekKey('2026-06-23');
      const key2 = getISOWeekKey('2026-06-25');
      expect(key1).toBe(key2);
    });

    it('different weeks have different keys', () => {
      const key1 = getISOWeekKey('2026-06-15');
      const key2 = getISOWeekKey('2026-06-23');
      expect(key1).not.toBe(key2);
    });
  });

  describe('compareDates', () => {
    it('returns -1 when first date is before second', () => {
      expect(compareDates('2026-06-23', '2026-06-25')).toBe(-1);
    });

    it('returns 1 when first date is after second', () => {
      expect(compareDates('2026-06-25', '2026-06-23')).toBe(1);
    });

    it('returns 0 when dates are equal', () => {
      expect(compareDates('2026-06-23', '2026-06-23')).toBe(0);
    });

    it('ignores time component', () => {
      expect(compareDates('2026-06-23T12:00:00Z', '2026-06-23T18:00:00Z')).toBe(0);
    });
  });

  describe('isToday', () => {
    it('returns true for today\'s date', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      expect(isToday(todayStr)).toBe(true);
    });

    it('returns false for other dates', () => {
      expect(isToday('2026-06-23')).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('returns true for future dates', () => {
      expect(isFuture('2099-12-31')).toBe(true);
    });

    it('returns false for past dates', () => {
      expect(isFuture('2000-01-01')).toBe(false);
    });
  });

  describe('isPast', () => {
    it('returns true for past dates', () => {
      expect(isPast('2000-01-01')).toBe(true);
    });

    it('returns false for future dates', () => {
      expect(isPast('2099-12-31')).toBe(false);
    });
  });
});
