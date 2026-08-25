export const XP_CORRECT = 10;
export const XP_WRONG = 2;
export const XP_EXAM_COMPLETE = 50;
export const XP_PERFECT_BONUS = 100;

const MAX_LEVEL = 50;

// Cumulative XP required to reach each level (index = level - 1)
const LEVEL_THRESHOLDS: number[] = Array.from({ length: MAX_LEVEL }, (_, i) =>
  i === 0 ? 0 : Math.round(100 * Math.pow(i + 1, 1.8))
);

export function computeLevel(totalXp: number): number {
  let level = 1;
  for (let i = 1; i < MAX_LEVEL; i++) {
    if (totalXp >= (LEVEL_THRESHOLDS[i] ?? 0)) level = i + 1;
    else break;
  }
  return level;
}

export function getXPProgress(totalXp: number): { level: number; currentXp: number; nextLevelXp: number; pct: number } {
  const level = computeLevel(totalXp);
  const currentFloor = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextFloor = level < MAX_LEVEL ? (LEVEL_THRESHOLDS[level] ?? currentFloor + 1) : currentFloor + 1;
  const currentXp = totalXp - currentFloor;
  const nextLevelXp = nextFloor - currentFloor;
  const pct = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));
  return { level, currentXp, nextLevelXp, pct };
}

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  emoji: string;
  category: 'questions' | 'tests' | 'perfect' | 'streak' | 'exam_type';
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Question milestones
  { key: 'first_answer',  name: 'First Step',        description: 'Answer your first question',           emoji: '🌱', category: 'questions' },
  { key: 'ten_answers',   name: 'Getting Started',   description: 'Answer 10 questions',                  emoji: '📖', category: 'questions' },
  { key: 'fifty_answers', name: 'On a Roll',         description: 'Answer 50 questions',                  emoji: '🎯', category: 'questions' },
  { key: 'century',       name: 'Century Club',      description: 'Answer 100 questions',                 emoji: '💯', category: 'questions' },
  { key: 'five_hundred',  name: 'Dedicated',         description: 'Answer 500 questions',                 emoji: '⭐', category: 'questions' },
  { key: 'thousand',      name: 'Legend',            description: 'Answer 1,000 questions',               emoji: '🏆', category: 'questions' },
  // Test milestones
  { key: 'first_test',       name: 'Test Taker',     description: 'Complete your first exam',             emoji: '📝', category: 'tests' },
  { key: 'five_tests',       name: 'Consistent',     description: 'Complete 5 exam sessions',             emoji: '📊', category: 'tests' },
  { key: 'ten_tests',        name: 'Exam Pro',        description: 'Complete 10 exam sessions',            emoji: '🎓', category: 'tests' },
  { key: 'twenty_five_tests',name: 'Exam Veteran',   description: 'Complete 25 exam sessions',            emoji: '🦅', category: 'tests' },
  // Perfect scores
  { key: 'perfect_practice', name: 'Flawless Practice', description: '100% on a practice session (≥5 questions)', emoji: '✨', category: 'perfect' },
  { key: 'perfect_timed',    name: 'Exam Ace',           description: '100% on a timed exam',                      emoji: '💎', category: 'perfect' },
  // Streak / login
  { key: 'first_login', name: 'First Login',      description: 'Welcome to ExamPrep!',                  emoji: '👋', category: 'streak' },
  { key: 'streak_3',    name: 'Warm Up',          description: 'Maintain a 3-day streak',               emoji: '🔥', category: 'streak' },
  { key: 'streak_7',    name: 'On Fire',          description: 'Maintain a 7-day streak',               emoji: '🌟', category: 'streak' },
  { key: 'streak_30',   name: 'Unstoppable',      description: 'Maintain a 30-day streak',              emoji: '⚡', category: 'streak' },
  { key: 'streak_365',  name: 'Legend Status',    description: 'Maintain a 365-day streak',             emoji: '👑', category: 'streak' },
  // Exam type
  { key: 'cma_badge', name: 'CMA Explorer', description: 'Answer a CMA question correctly', emoji: '📈', category: 'exam_type' },
  { key: 'cfa_badge', name: 'CFA Explorer', description: 'Answer a CFA question correctly', emoji: '📉', category: 'exam_type' },
  { key: 'fe_badge',  name: 'FE Explorer',  description: 'Answer an FE question correctly',  emoji: '⚙️', category: 'exam_type' },
];
