/**
 * Utility helper functions
 */

/**
 * Combines class names
 * Simple version without external dependencies
 * For advanced usage, consider adding 'clsx' and 'tailwind-merge' packages
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format a date string to a readable format
 * @throws {Error} If date is invalid
 */
export function formatDate(
  date: string | Date,
  format: 'full' | 'short' = 'short'
): string {
  if (date === null || date === undefined) return 'Invalid Date';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const options: Intl.DateTimeFormatOptions =
    format === 'full'
      ? { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
      : { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' };

  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format time in seconds to MM:SS format
 * Handles negative values and large numbers
 */
export function formatTime(seconds: number): string {
  const absSeconds = Math.abs(Math.floor(seconds));
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;
  const sign = seconds < 0 ? '-' : '';

  return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate percentage score with validation
 * @returns Percentage between 0-100
 */
export function calculatePercentage(correct: number, total: number): number {
  if (total <= 0) {
    console.warn('Total must be greater than 0');
    return 0;
  }
  
  if (correct < 0) {
    console.warn('Correct count cannot be negative');
    return 0;
  }
  
  if (correct > total) {
    console.warn('Correct count cannot exceed total');
    return 100;
  }
  
  return Math.round((correct / total) * 100);
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}


