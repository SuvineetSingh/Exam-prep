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

export const LOBBY_CONFIG = {
  MAX_MESSAGE_LENGTH: 500,
  MESSAGES_PER_PAGE: 100,
  PRESENCE_THROTTLE_MS: 1000,
} as const;
