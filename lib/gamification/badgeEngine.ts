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

export async function checkAndAwardBadges(ctx: BadgeCheckContext): Promise<BadgeDefinition[]> {
  const candidates: BadgeDefinition[] = [];

  const check = (key: string) => !ctx.earnedKeys.has(key);

  if (check('first_login') && ctx.totalAnswered >= 1)          candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'first_login')!);
  if (check('first_answer') && ctx.totalAnswered >= 1)         candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'first_answer')!);
  if (check('ten_answers') && ctx.totalAnswered >= 10)         candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'ten_answers')!);
  if (check('fifty_answers') && ctx.totalAnswered >= 50)       candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'fifty_answers')!);
  if (check('century') && ctx.totalAnswered >= 100)            candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'century')!);
  if (check('five_hundred') && ctx.totalAnswered >= 500)       candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'five_hundred')!);
  if (check('thousand') && ctx.totalAnswered >= 1000)          candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'thousand')!);

  if (check('first_test') && ctx.totalExams >= 1)              candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'first_test')!);
  if (check('five_tests') && ctx.totalExams >= 5)              candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'five_tests')!);
  if (check('ten_tests') && ctx.totalExams >= 10)              candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'ten_tests')!);
  if (check('twenty_five_tests') && ctx.totalExams >= 25)      candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'twenty_five_tests')!);

  if (check('perfect_practice') && ctx.practiceSessionPerfect) candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'perfect_practice')!);
  if (check('perfect_timed') && ctx.timedExamPerfect)          candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'perfect_timed')!);

  if (check('streak_3') && ctx.streak >= 3)                   candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'streak_3')!);
  if (check('streak_7') && ctx.streak >= 7)                   candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'streak_7')!);
  if (check('streak_30') && ctx.streak >= 30)                 candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'streak_30')!);
  if (check('streak_365') && ctx.streak >= 365)               candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'streak_365')!);

  if (check('cma_badge') && (ctx.correctByExamType['CMA'] ?? 0) >= 1) candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'cma_badge')!);
  if (check('cfa_badge') && (ctx.correctByExamType['CFA'] ?? 0) >= 1) candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'cfa_badge')!);
  if (check('fe_badge') && (ctx.correctByExamType['FE'] ?? 0) >= 1)   candidates.push(BADGE_DEFINITIONS.find(b => b.key === 'fe_badge')!);

  const valid = candidates.filter(Boolean);
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
