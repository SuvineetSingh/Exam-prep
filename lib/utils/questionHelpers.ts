import type { Question } from '@/lib/types';

/** Returns the four answer options as a string array, supporting both data shapes. */
export function getOptions(q: Question): string[] {
  if (q.options && q.options.length > 0) return q.options;
  return [q.option_a, q.option_b, q.option_c, q.option_d].filter(
    (o): o is string => typeof o === 'string' && o.length > 0
  );
}

/** Returns the correct option key as lowercase ('a' | 'b' | 'c' | 'd'). */
export function getCorrectKey(q: Question): string {
  return (q.correct_answer || q.correct_option || '').trim().toLowerCase();
}

/** Normalizes any option key to lowercase for comparison. */
export function normalizeKey(key: string): string {
  return key.trim().toLowerCase();
}

/** Returns Tailwind classes and a display label for a difficulty level. */
export function getDifficultyStyle(difficulty: string): { label: string; className: string } {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return { label: 'Easy', className: 'bg-green-100 text-green-700' };
    case 'medium':
      return { label: 'Medium', className: 'bg-amber-100 text-amber-700' };
    case 'hard':
      return { label: 'Hard', className: 'bg-red-100 text-brand-coral' };
    default:
      return { label: difficulty ?? 'Unknown', className: 'bg-neutral-100 text-neutral-500' };
  }
}

/** Returns Tailwind classes for an exam type badge. */
export function getExamTypeBadgeClass(examType: string): string {
  switch (examType?.toUpperCase()) {
    case 'CMA': return 'exam-badge-cma';
    case 'CFA': return 'exam-badge-cfa';
    case 'FE':  return 'exam-badge-fe';
    default:    return 'bg-neutral-100 text-neutral-600 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold';
  }
}
