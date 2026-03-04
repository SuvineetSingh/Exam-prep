import { createClient } from '@/lib/supabase/client';
import type { UserStats } from '@/lib/types';

/**
 * Saves a user's answer to a question
 */
export async function saveUserAnswer(
  questionId: number,
  selectedAnswer: string,
  isCorrect: boolean,
  timeSpent: number = 0,
  mode: 'practice' | 'timed' = 'practice',
  examSessionId: string | null = null
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
  
  const { data, error } = await supabase
    .from('user_answers')
    .select('is_correct, answered_at')
    .eq('user_id', user.id);
    
  if (error) {
    // Gracefully handle missing table or permissions - return zeros instead of breaking dashboard
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ Could not fetch user stats. This is normal if the user_answers table has not been created yet.',
        '\nError:', error.message || 'Unknown error'
      );
    }
    
    return {
      total_answered: 0,
      accuracy_rate: 0,
      study_streak: 0,
      today_count: 0,
      this_week_improvement: 0,
    };
  }
  
  if (!data || data.length === 0) {
    return {
      total_answered: 0,
      accuracy_rate: 0,
      study_streak: 0,
      today_count: 0,
      this_week_improvement: 0,
    };
  }
  
  const totalAnswered = data.length;
  const correctCount = data.filter(a => a.is_correct).length;
  const accuracyRate = totalAnswered > 0 
    ? Math.round((correctCount / totalAnswered) * 100) 
    : 0;
  
  const today = new Date().toISOString().split('T')[0];
  const todayCount = data.filter(a =>
    a.answered_at.startsWith(today)
  ).length;

  // Calculate consecutive days with activity (simplified streak algorithm)
  const uniqueDates = [...new Set(data.map(a =>
    a.answered_at.split('T')[0]
  ))].sort().reverse();
  
  let streak = 0;
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  
  for (const dateStr of uniqueDates) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor(
      (todayDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff === streak) {
      streak++;
    } else {
      break;
    }
  }
  
  return {
    total_answered: totalAnswered,
    accuracy_rate: accuracyRate,
    study_streak: streak,
    today_count: todayCount,
    this_week_improvement: 0, // TODO: Implement weekly comparison
  };
}
