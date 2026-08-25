import { createClient } from '@/lib/supabase/client';
import { BADGE_DEFINITIONS, type BadgeDefinition } from './constants';

export async function getEarnedBadgeKeys(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from('user_achievements')
    .select('achievement_key')
    .eq('user_id', userId);
  return new Set((data ?? []).map(r => r.achievement_key));
}

interface BadgeCheckContext {
  userId: string;
  totalAnswered: number;
  totalCorrect: number;
  totalExams: number;
  streak: number;
  correctByExamType: Record<string, number>;
  practiceSessionPerfect?: boolean; // true if current practice session was 100%
  timedExamPerfect?: boolean;       // true if current timed exam was 100%
  earnedKeys: Set<string>;
}

const BADGE_CONDITIONS: Record<string, (ctx: BadgeCheckContext) => boolean> = {
  first_login: ctx => ctx.totalAnswered >= 1,
  first_answer: ctx => ctx.totalAnswered >= 1,
  ten_answers: ctx => ctx.totalAnswered >= 10,
  fifty_answers: ctx => ctx.totalAnswered >= 50,
  century: ctx => ctx.totalAnswered >= 100,
  five_hundred: ctx => ctx.totalAnswered >= 500,
  thousand: ctx => ctx.totalAnswered >= 1000,

  first_test: ctx => ctx.totalExams >= 1,
  five_tests: ctx => ctx.totalExams >= 5,
  ten_tests: ctx => ctx.totalExams >= 10,
  twenty_five_tests: ctx => ctx.totalExams >= 25,

  perfect_practice: ctx => !!ctx.practiceSessionPerfect,
  perfect_timed: ctx => !!ctx.timedExamPerfect,

  streak_3: ctx => ctx.streak >= 3,
  streak_7: ctx => ctx.streak >= 7,
  streak_30: ctx => ctx.streak >= 30,
  streak_365: ctx => ctx.streak >= 365,

  cma_badge: ctx => (ctx.correctByExamType['CMA'] ?? 0) >= 1,
  cfa_badge: ctx => (ctx.correctByExamType['CFA'] ?? 0) >= 1,
  fe_badge: ctx => (ctx.correctByExamType['FE'] ?? 0) >= 1,
};

export async function checkAndAwardBadges(ctx: BadgeCheckContext): Promise<BadgeDefinition[]> {
  const valid = BADGE_DEFINITIONS.filter(
    b => !ctx.earnedKeys.has(b.key) && BADGE_CONDITIONS[b.key]?.(ctx)
  );
  if (valid.length === 0) return [];

  const supabase = createClient();
  await supabase.from('user_achievements').insert(
    valid.map(b => ({ user_id: ctx.userId, achievement_key: b.key }))
  );

  return valid;
}

export async function buildBadgeContext(
  userId: string,
  streak: number,
  extras?: { practiceSessionPerfect?: boolean; timedExamPerfect?: boolean }
): Promise<Omit<BadgeCheckContext, 'userId' | 'earnedKeys'>> {
  const supabase = createClient();

  const [answersRes, examsRes, correctByTypeRes] = await Promise.all([
    supabase.from('user_answers').select('id, is_correct', { count: 'exact' }).eq('user_id', userId),
    supabase.from('exam_sessions').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('user_answers').select('exam_type').eq('user_id', userId).eq('is_correct', true),
  ]);

  const totalAnswered = answersRes.count ?? 0;
  const totalCorrect = (answersRes.data ?? []).filter(r => r.is_correct).length;
  const totalExams = examsRes.count ?? 0;

  const correctByExamType: Record<string, number> = {};
  for (const row of correctByTypeRes.data ?? []) {
    if (row.exam_type) {
      const key = String(row.exam_type).toUpperCase();
      correctByExamType[key] = (correctByExamType[key] ?? 0) + 1;
    }
  }

  return {
    totalAnswered,
    totalCorrect,
    totalExams,
    streak,
    correctByExamType,
    ...extras,
  };
}
