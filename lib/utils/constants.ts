export const MINS_PER_QUESTION = 1.5;

export const COURSE_PRICES_CENTS: Record<string, number> = {
  CMA: 5900,
  CFA: 4900,
  FE:  4900,
};

export const COURSE_PRICE_DISPLAY: Record<string, string> = {
  CMA: '$59',
  CFA: '$49',
  FE:  '$49',
};

export const COURSE_CATALOG = [
  {
    exam_type: 'CMA',
    name: 'CMA — Certified Management Accountant',
    description: 'Financial planning, analysis, control, decision support, and professional ethics.',
    icon: '📊',
    color: 'amber',
  },
  {
    exam_type: 'CFA',
    name: 'CFA — Chartered Financial Analyst',
    description: 'Portfolio management, equity analysis, fixed income, derivatives, and ethics.',
    icon: '📈',
    color: 'violet',
  },
  {
    exam_type: 'FE',
    name: 'FE — Fundamentals of Engineering',
    description: 'Mathematics, engineering sciences, and discipline-specific technical topics.',
    icon: '⚙️',
    color: 'teal',
  },
] as const;

export const EXAM_TYPES = {
  CMA: 'CMA',
  CFA: 'CFA',
  FE: 'FE',
} as const;

export type ExamType = (typeof EXAM_TYPES)[keyof typeof EXAM_TYPES];

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type QuestionType = 'multiple_choice' | 'true_false' | 'essay' | 'calculation';

// App configuration
export const APP_CONFIG = {
  NAME: 'Exam Prep Platform',
  DESCRIPTION: 'Web-based question bank platform for CMA, CFA, and FE exam preparation',
  URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
} as const;

