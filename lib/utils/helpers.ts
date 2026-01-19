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
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Validate date
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }
  
  const options: Intl.DateTimeFormatOptions =
    format === 'full'
      ? { month: 'long', day: 'numeric', year: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' };
  
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
 * Truncate text to a specified length
 * @param text Text to truncate
 * @param length Maximum length (must be positive)
 * @param suffix Suffix to add (default: '...')
 */
export function truncate(
  text: string,
  length: number,
  suffix: string = '...'
): string {
  if (length < 0) {
    throw new Error('Length must be positive');
  }
  
  if (text.length <= length) {
    return text;
  }
  
  return text.slice(0, Math.max(0, length - suffix.length)) + suffix;
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Deep clone an object using structuredClone (Node 17+, modern browsers)
 * Falls back to JSON method for simple objects
 * 
 * @warning JSON fallback loses functions, undefined, Dates, RegExp, etc.
 * For complex objects, consider using lodash.cloneDeep
 */
export function deepClone<T>(obj: T): T {
  // Use native structuredClone if available (best option)
  if (typeof structuredClone !== 'undefined') {
    try {
      return structuredClone(obj);
    } catch (error) {
      console.warn('structuredClone failed, falling back to JSON method', error);
    }
  }

  // Fallback to JSON method (has limitations)
  try {
    return JSON.parse(JSON.stringify(obj)) as T;
  } catch (error) {
    console.error('Deep clone failed', error);
    throw new Error('Unable to deep clone object');
  }
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

/**
 * Generate a cryptographically secure random ID
 * Uses crypto.randomUUID() when available
 * 
 * @returns A RFC4122 version 4 UUID
 */
export function generateId(): string {
  // Use native crypto.randomUUID if available (Node 19+, modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older environments with crypto.getRandomValues
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (crypto.getRandomValues(new Uint8Array(1))[0]! % 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Last resort: timestamp-based (not secure, use only for non-critical IDs)
  console.warn('Using non-cryptographic ID generation. Consider upgrading runtime.');
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
