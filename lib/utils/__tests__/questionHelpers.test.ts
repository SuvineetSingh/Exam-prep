import {
  getOptions,
  getCorrectKey,
  normalizeKey,
  getDifficultyStyle,
  getExamTypeBadgeClass,
} from '@/lib/utils/questionHelpers';
import type { Question } from '@/lib/types';

const baseQuestion: Question = {
  id: '1',
  exam_type: 'CMA',
  difficulty: 'medium',
  question_type: 'multiple_choice',
  question_text: 'What is 2 + 2?',
  options: null,
  correct_answer: 'b',
  explanation: 'Basic arithmetic.',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('getOptions', () => {
  it('returns the options array when populated', () => {
    const q = { ...baseQuestion, options: ['Alpha', 'Beta', 'Gamma', 'Delta'] };
    expect(getOptions(q)).toEqual(['Alpha', 'Beta', 'Gamma', 'Delta']);
  });

  it('falls back to option_a/b/c/d when options is null', () => {
    const q = {
      ...baseQuestion,
      options: null,
      option_a: 'One',
      option_b: 'Two',
      option_c: 'Three',
      option_d: 'Four',
    };
    expect(getOptions(q)).toEqual(['One', 'Two', 'Three', 'Four']);
  });

  it('falls back to option_a/b/c/d when options is an empty array', () => {
    const q = {
      ...baseQuestion,
      options: [],
      option_a: 'One',
      option_b: 'Two',
      option_c: 'Three',
      option_d: 'Four',
    };
    expect(getOptions(q)).toEqual(['One', 'Two', 'Three', 'Four']);
  });

  it('filters out null/empty option columns', () => {
    const q = { ...baseQuestion, options: null, option_a: 'Only', option_b: null };
    expect(getOptions(q)).toEqual(['Only']);
  });
});

describe('getCorrectKey', () => {
  it('returns lowercase correct_answer', () => {
    expect(getCorrectKey({ ...baseQuestion, correct_answer: 'B' })).toBe('b');
  });

  it('trims whitespace from correct_answer', () => {
    expect(getCorrectKey({ ...baseQuestion, correct_answer: '  C  ' })).toBe('c');
  });

  it('falls back to correct_option when correct_answer is empty', () => {
    const q = { ...baseQuestion, correct_answer: '', correct_option: 'D' };
    expect(getCorrectKey(q)).toBe('d');
  });

  it('returns empty string when both fields are missing', () => {
    const q = { ...baseQuestion, correct_answer: '', correct_option: null };
    expect(getCorrectKey(q)).toBe('');
  });
});

describe('normalizeKey', () => {
  it('lowercases an uppercase key', () => {
    expect(normalizeKey('A')).toBe('a');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeKey('  B  ')).toBe('b');
  });
});

describe('getDifficultyStyle', () => {
  it('returns green style for easy', () => {
    const style = getDifficultyStyle('easy');
    expect(style.label).toBe('Easy');
    expect(style.className).toContain('green');
  });

  it('returns amber style for medium', () => {
    const style = getDifficultyStyle('medium');
    expect(style.label).toBe('Medium');
    expect(style.className).toContain('amber');
  });

  it('returns red/coral style for hard', () => {
    const style = getDifficultyStyle('hard');
    expect(style.label).toBe('Hard');
    expect(style.className).toContain('red');
  });

  it('is case-insensitive', () => {
    expect(getDifficultyStyle('EASY').label).toBe('Easy');
    expect(getDifficultyStyle('Medium').label).toBe('Medium');
  });

  it('returns a fallback for unknown difficulty', () => {
    const style = getDifficultyStyle('expert');
    expect(style.label).toBe('expert');
    expect(style.className).toContain('neutral');
  });
});

describe('getExamTypeBadgeClass', () => {
  it('returns CMA badge class', () => {
    expect(getExamTypeBadgeClass('CMA')).toBe('exam-badge-cma');
  });

  it('returns CFA badge class', () => {
    expect(getExamTypeBadgeClass('CFA')).toBe('exam-badge-cfa');
  });

  it('returns FE badge class', () => {
    expect(getExamTypeBadgeClass('FE')).toBe('exam-badge-fe');
  });

  it('is case-insensitive', () => {
    expect(getExamTypeBadgeClass('cma')).toBe('exam-badge-cma');
  });
});
