/** Merges class names, filtering out falsy values. */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Formats a date string or Date object to a readable format. */
export function formatDate(
  date: string | Date | null | undefined,
  format: 'full' | 'short' = 'short'
): string {
  if (date === null || date === undefined) return 'Invalid Date';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid Date';
  const opts: Intl.DateTimeFormatOptions =
    format === 'full'
      ? { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
      : { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' };
  return d.toLocaleDateString('en-US', opts);
}

/** Formats a duration in seconds to MM:SS. Handles negative values. */
export function formatTime(seconds: number): string {
  const abs = Math.abs(Math.floor(seconds));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${seconds < 0 ? '-' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Returns percentage (0–100) of correct out of total. */
export function calculatePercentage(correct: number, total: number): number {
  if (total <= 0 || correct < 0) return 0;
  if (correct > total) return 100;
  return Math.round((correct / total) * 100);
}

/** Returns true if value is null, undefined, empty string, empty array, or empty object. */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}
