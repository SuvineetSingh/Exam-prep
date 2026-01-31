import { 
  cn, 
  formatDate, 
  formatTime, 
  calculatePercentage, 
  truncate, 
  shuffleArray, 
  isEmpty 
} from '../helpers';

describe('Helper Functions', () => {
  describe('cn (className merger)', () => {
    it('merges class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('handles conditional classes', () => {
      const result = cn('base', false && 'hidden', true && 'visible');
      expect(result).toContain('base');
      expect(result).not.toContain('hidden');
      expect(result).toContain('visible');
    });

    it('handles undefined and null', () => {
      const result = cn('base', undefined, null, 'end');
      expect(result).toContain('base');
      expect(result).toContain('end');
    });
  });

  describe('formatDate', () => {
    it('formats valid date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toMatch(/Jan.*15.*2024/);
    });

    it('formats Date object', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toMatch(/Jan.*15.*2024/);
    });

    it('returns Invalid Date for invalid input', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('Invalid Date');
    });

    it('handles null gracefully', () => {
      const result = formatDate(null as any);
      expect(result).toBe('Invalid Date');
    });
  });

  describe('formatTime', () => {
    it('formats valid time string', () => {
      const result = formatTime('2024-01-15T14:30:00');
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('returns Invalid Time for invalid input', () => {
      const result = formatTime('invalid');
      expect(result).toBe('Invalid Time');
    });
  });

  describe('calculatePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 3)).toBe(33);
      expect(calculatePercentage(2, 3)).toBe(67);
    });

    it('returns 0 for zero total', () => {
      expect(calculatePercentage(5, 0)).toBe(0);
    });

    it('returns 0 for negative numbers', () => {
      expect(calculatePercentage(-5, 10)).toBe(0);
      expect(calculatePercentage(5, -10)).toBe(0);
    });

    it('handles 100% correctly', () => {
      expect(calculatePercentage(10, 10)).toBe(100);
    });

    it('handles decimals', () => {
      expect(calculatePercentage(0.5, 1)).toBe(50);
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      const longString = 'This is a very long string that should be truncated';
      const result = truncate(longString, 20);
      
      expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(result).toContain('...');
    });

    it('does not truncate short strings', () => {
      const shortString = 'Short';
      const result = truncate(shortString, 20);
      
      expect(result).toBe(shortString);
      expect(result).not.toContain('...');
    });

    it('handles empty string', () => {
      expect(truncate('', 10)).toBe('');
    });

    it('handles exact length', () => {
      const exactString = 'Exactly20Characters!';
      const result = truncate(exactString, 20);
      
      expect(result).toBe(exactString);
    });

    it('handles invalid input', () => {
      expect(truncate(null as any, 10)).toBe('');
      expect(truncate(undefined as any, 10)).toBe('');
    });
  });

  describe('shuffleArray', () => {
    it('returns array with same length', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray([...arr]);
      
      expect(shuffled.length).toBe(arr.length);
    });

    it('contains all original elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray([...arr]);
      
      arr.forEach(item => {
        expect(shuffled).toContain(item);
      });
    });

    it('handles empty array', () => {
      const result = shuffleArray([]);
      expect(result).toEqual([]);
    });

    it('handles single element', () => {
      const result = shuffleArray([1]);
      expect(result).toEqual([1]);
    });

    it('does not mutate original array', () => {
      const arr = [1, 2, 3];
      const original = [...arr];
      shuffleArray(arr);
      
      expect(arr).toEqual(original);
    });
  });

  describe('isEmpty', () => {
    it('returns true for null and undefined', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('returns true for empty string', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('returns true for empty array', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('returns true for empty object', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('returns false for non-empty string', () => {
      expect(isEmpty('hello')).toBe(false);
    });

    it('returns false for non-empty array', () => {
      expect(isEmpty([1, 2, 3])).toBe(false);
    });

    it('returns false for non-empty object', () => {
      expect(isEmpty({ key: 'value' })).toBe(false);
    });

    it('returns false for numbers', () => {
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(42)).toBe(false);
    });

    it('returns false for boolean values', () => {
      expect(isEmpty(false)).toBe(false);
      expect(isEmpty(true)).toBe(false);
    });
  });
});
