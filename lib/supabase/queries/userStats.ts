import { createClient } from '@/lib/supabase/client';
import type { UserStats, CourseName } from '@/lib/types';

/**
 * Returns the list of course names (CMA, CFA, FE) the user has purchased Pro access for.
 */
export async function getUserCourseSubscriptions(): Promise<CourseName[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('course_subscriptions')
    .select('course')
    .eq('user_id', user.id);

  if (error || !data) return [];
  return data.map((row) => row.course as CourseName);
}

/**
 * Saves a user's answer to a question
 */
export async function saveUserAnswer(
  questionId: number,
  selectedAnswer: string,
  isCorrect: boolean,
  timeSpent: number = 0,
  mode: 'practice' | 'timed' = 'practice',
  examSessionId: string | null = null,
  examType: string | null = null
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { error } = await supabase.from('user_answers').insert({
    user_id: user.id,
    question_id: questionId,
    selected_answer: selectedAnswer,
    is_correct: isCorrect,
    time_spent: timeSpent,
    mode: mode,
    exam_session_id: examSessionId,
    exam_type: examType,
  });

  if (error) {
    console.error('Error saving answer:', {
      error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { success: false, error: error.message || 'Failed to save answer' };
  }

  return { success: true };
}

/**
 * Gets a set of question IDs that the user has attempted
 */
export async function getAttemptedQuestionIds(): Promise<Set<number>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new Set();

  const { data, error } = await supabase
    .from('user_answers')
    .select('question_id')
    .eq('user_id', user.id);

  if (error || !data) return new Set();

  return new Set(data.map(a => a.question_id));
}

/**
 * Fetches and calculates user statistics from database
 * Returns default zeros if table doesn't exist or user has no data
 */
export async function getUserStats(): Promise<UserStats | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const ZERO_STATS: UserStats = {
    total_answered: 0,
    practice_answered: 0,
    timed_answered: 0,
    accuracy_rate: 0,
    study_streak: 0,
    today_count: 0,
    this_week_improvement: 0,
  };

  const { data, error } = await supabase
    .from('user_answers')
    .select('is_correct, mode, created_at')
    .eq('user_id', user.id);

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ Could not fetch user stats. This is normal if the user_answers table has not been created yet.',
        '\nError:', error.message || 'Unknown error'
      );
    }
    return ZERO_STATS;
  }

  if (!data || data.length === 0) {
    return ZERO_STATS;
  }

  const totalAnswered = data.length;
  const practiceAnswered = data.filter(a => a.mode === 'practice').length;
  const timedAnswered = data.filter(a => a.mode === 'timed').length;
  const correctCount = data.filter(a => a.is_correct).length;
  const accuracyRate = totalAnswered > 0
    ? Math.round((correctCount / totalAnswered) * 100)
    : 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = data.filter(a => a.created_at.startsWith(todayStr)).length;

  // Calculate consecutive days with activity — use UTC throughout to avoid timezone shifts
  const uniqueDays = new Set(data.map(a => a.created_at.slice(0, 10)));
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  let cursor = new Date(todayStr + 'T00:00:00Z');

  if (!uniqueDays.has(todayStr)) {
    cursor = new Date(cursor.getTime() - MS_PER_DAY);
  }

  let streak = 0;
  while (uniqueDays.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor = new Date(cursor.getTime() - MS_PER_DAY);
  }

  return {
    total_answered: totalAnswered,
    practice_answered: practiceAnswered,
    timed_answered: timedAnswered,
    accuracy_rate: accuracyRate,
    study_streak: streak,
    today_count: todayCount,
    this_week_improvement: 0,
  };
}
