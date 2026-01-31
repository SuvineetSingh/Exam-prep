import { createClient } from '@/lib/supabase/client';
import type { UserStats } from '@/lib/types';

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
    .select('is_correct, created_at')
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
    a.created_at.startsWith(today)
  ).length;
  
  // Calculate consecutive days with activity (simplified streak algorithm)
  const uniqueDates = [...new Set(data.map(a => 
    a.created_at.split('T')[0]
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
