export const INDUSTRIES = [
  'General',
  'Accounting',
  'Finance',
  'Engineering',
  'Technology',
  'Healthcare',
  'Legal',
  'Education',
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const STUDY_TIMES = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'night', label: 'Night' },
] as const;

export type StudyTime = (typeof STUDY_TIMES)[number]['value'];

export const LOBBY_CONFIG = {
  MAX_MESSAGE_LENGTH: 500,
  MESSAGES_PER_PAGE: 100,
  PRESENCE_THROTTLE_MS: 1000,
} as const;
