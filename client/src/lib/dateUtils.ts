/**
 * Centralized date utilities to prevent recurring timezone bugs.
 * 
 * IMPORTANT: Database dates are stored as DATE (YYYY-MM-DD) without timezone info.
 * When serialized to JSON, they may be interpreted as UTC, causing off-by-one-day bugs.
 * 
 * ALWAYS use these utilities instead of `new Date(dateString)` directly.
 */

/**
 * Parse a date string "YYYY-MM-DD" as a local date (not UTC).
 * This prevents the off-by-one-day bug that occurs when using `new Date()` directly.
 * 
 * @example
 * parseLocalDate("2026-06-23") // Returns June 23, 2026 at 00:00 local time
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Extract just the date part from a Date or string (removes time/timezone info).
 * 
 * @example
 * getDateOnly(new Date()) // Returns "2026-06-25"
 * getDateOnly("2026-06-25T12:00:00Z") // Returns "2026-06-25"
 */
export function getDateOnly(date: Date | string): string {
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

/**
 * Format a date for display in user-friendly format.
 * 
 * @example
 * formatDate("2026-06-23") // Returns "Tue, Jun 23, 2026"
 * formatDate(new Date(2026, 5, 23)) // Returns "Tue, Jun 23, 2026"
 */
export function formatDate(date: Date | string): string {
  // Always go through getDateOnly → parseLocalDate so a raw UTC-midnight Date
  // object (what mysql2 returns for DATE columns) doesn't show the previous day
  // in UTC-offset timezones like Montreal (UTC-4).
  const d = parseLocalDate(getDateOnly(typeof date === 'string' ? date : date.toISOString()));
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a time string "HH:MM" to "h:MM AM/PM" format.
 * 
 * @example
 * formatTime("21:30") // Returns "9:30 PM"
 * formatTime("09:00") // Returns "9:00 AM"
 */
export function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

/**
 * Format a complete date and time for display.
 * 
 * @example
 * formatDateTime("2026-06-23", "21:30") // Returns "Tue, Jun 23, 2026 · 9:30 PM"
 */
export function formatDateTime(date: Date | string, time: string): string {
  return `${formatDate(date)} · ${formatTime(time)}`;
}

/**
 * Get ISO week key "YYYY-Www" for a date string.
 * Used for grouping games by week in schedule management.
 * 
 * @example
 * getISOWeekKey("2026-06-23") // Returns "2026-W26"
 */
export function getISOWeekKey(dateStr: string): string {
  const d = parseLocalDate(getDateOnly(dateStr));
  const tmp = new Date(d);
  const dow = tmp.getDay() === 0 ? 7 : tmp.getDay(); // Mon=1..Sun=7
  tmp.setDate(tmp.getDate() + 4 - dow);
  const yearStart = new Date(tmp.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Compare two dates (ignoring time).
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 * 
 * @example
 * compareDates("2026-06-23", "2026-06-25") // Returns -1
 */
export function compareDates(date1: string, date2: string): number {
  const d1 = getDateOnly(date1);
  const d2 = getDateOnly(date2);
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
}

/**
 * Check if a date is today (local timezone).
 * 
 * @example
 * isToday("2026-06-25") // Returns true if today is June 25, 2026
 */
export function isToday(dateStr: string): boolean {
  const today = new Date();
  const todayStr = getDateOnly(today);
  return getDateOnly(dateStr) === todayStr;
}

/**
 * Check if a date is in the future (local timezone).
 * 
 * @example
 * isFuture("2026-06-25") // Returns true if June 25, 2026 is in the future
 */
export function isFuture(dateStr: string): boolean {
  return compareDates(getDateOnly(new Date()), dateStr) < 0;
}

/**
 * Check if a date is in the past (local timezone).
 * 
 * @example
 * isPast("2026-06-23") // Returns true if June 23, 2026 is in the past
 */
export function isPast(dateStr: string): boolean {
  return compareDates(getDateOnly(new Date()), dateStr) > 0;
}
