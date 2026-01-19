/**
 * Application-wide constants
 */

// Exam types supported by the platform
export const EXAM_TYPES = {
  CPA: 'CPA',
  CFA: 'CFA',
  FE: 'FE',
} as const;

export type ExamType = (typeof EXAM_TYPES)[keyof typeof EXAM_TYPES];

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
} as const;

export type SubscriptionPlan =
  (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS];

// Question difficulty levels
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export type DifficultyLevel =
  (typeof DIFFICULTY_LEVELS)[keyof typeof DIFFICULTY_LEVELS];

// Question types
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  ESSAY: 'essay',
  CALCULATION: 'calculation',
} as const;

export type QuestionType =
  (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

// App configuration
export const APP_CONFIG = {
  NAME: 'Exam Prep Platform',
  DESCRIPTION: 'Web-based question bank platform for CPA, CFA, and FE exam preparation',
  URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'exam-prep-theme',
  RECENT_EXAMS: 'exam-prep-recent-exams',
  PREFERENCES: 'exam-prep-preferences',
} as const;

// API routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  QUESTIONS: {
    LIST: '/api/questions',
    CREATE: '/api/questions',
    UPDATE: (id: string) => `/api/questions/${id}`,
    DELETE: (id: string) => `/api/questions/${id}`,
  },
  EXAMS: {
    LIST: '/api/exams',
    CREATE: '/api/exams',
    GET: (id: string) => `/api/exams/${id}`,
  },
  SUBSCRIPTIONS: {
    PLANS: '/api/subscriptions/plans',
    CREATE: '/api/subscriptions/create',
    CANCEL: '/api/subscriptions/cancel',
  },
} as const;

// Date formats
export const DATE_FORMATS = {
  FULL: 'MMMM dd, yyyy',
  SHORT: 'MMM dd, yyyy',
  TIME: 'HH:mm:ss',
  DATETIME: 'MMM dd, yyyy HH:mm',
} as const;

// Environment detection
export const ENV = {
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
  IS_BROWSER: typeof window !== 'undefined',
  IS_SERVER: typeof window === 'undefined',
} as const;

// Feature flags
export const FEATURES = {
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_ERROR_REPORTING: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true',
  ENABLE_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
} as const;
