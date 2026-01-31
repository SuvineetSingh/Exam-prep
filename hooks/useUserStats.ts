import { useState, useEffect } from 'react';
import { getUserStats } from '@/lib/supabase/queries/userStats';
import type { UserStats } from '@/lib/types';

export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);
        const data = await getUserStats();
        
        if (data) {
          setStats(data);
        } else {
          setStats({
            total_answered: 0,
            accuracy_rate: 0,
            study_streak: 0,
            today_count: 0,
            this_week_improvement: 0,
          });
        }
      } catch (err) {
        console.error('Unexpected error in useUserStats:', err);
        setStats({
          total_answered: 0,
          accuracy_rate: 0,
          study_streak: 0,
          today_count: 0,
          this_week_improvement: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
