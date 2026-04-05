'use client';

import { useEffect, useState } from 'react';
import { getUserStats } from '@/lib/supabase/queries/userStats';
import type { UserStats } from '@/lib/types';

const DEFAULT_STATS: UserStats = {
  total_answered: 0,
  accuracy_rate: 0,
  study_streak: 0,
  today_count: 0,
  this_week_improvement: 0,
};

export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const result = await getUserStats();
        setStats(result ?? DEFAULT_STATS);
      } catch (err) {
        console.error('Failed to load user stats:', err);
        setStats(DEFAULT_STATS);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
