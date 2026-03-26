'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface UserStats {
  // Total questions answered (all modes, excludes UNATTEMPTED)
  total_answered: number;

  // Breakdown by mode
  practice_answered: number;
  timed_answered: number;

  // Today's count (all modes)
  today_count: number;

  // Accuracy: correct / total_answered * 100  (excludes UNATTEMPTED)
  accuracy_rate: number;

  // Study streak in days
  study_streak: number;
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createClient();

        // Get authenticated user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError('Not authenticated');
          return;
        }

        const userId = user.id;

        // ── 1. Fetch all non-UNATTEMPTED answers for the user ──────────────
        // We fetch only the columns we need to keep the payload small.
        const { data: answers, error: answersError } = await supabase
          .from('user_answers')
          .select('is_correct, mode, answered_at')
          .eq('user_id', userId)
          .neq('selected_answer', 'UNATTEMPTED');

        if (answersError) {
          throw new Error(answersError.message);
        }

        if (!answers || answers.length === 0) {
          setStats({
            total_answered: 0,
            practice_answered: 0,
            timed_answered: 0,
            today_count: 0,
            accuracy_rate: 0,
            study_streak: 0,
          });
          return;
        }

        // ── 2. Derive stats from the fetched rows (client-side aggregation) ─
        const total_answered = answers.length;

        const practice_answered = answers.filter(
          (a) => a.mode === 'practice'
        ).length;

        const timed_answered = answers.filter(
          (a) => a.mode === 'timed'
        ).length;

        const correct_count = answers.filter((a) => a.is_correct).length;

        const accuracy_rate =
          total_answered > 0
            ? Math.round((correct_count / total_answered) * 100)
            : 0;

        // ── 3. Today's count ───────────────────────────────────────────────
        // Compare against the start of today in UTC to keep it server-safe.
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const today_count = answers.filter(
          (a) => new Date(a.answered_at) >= todayStart
        ).length;

        // ── 4. Study streak ────────────────────────────────────────────────
        // Build a set of unique ISO date strings (YYYY-MM-DD) on which the
        // user answered at least one question, then count consecutive days
        // backwards from today.
        const uniqueDays = new Set(
          answers.map((a) => a.answered_at.slice(0, 10)) // "YYYY-MM-DD"
        );

        let study_streak = 0;
        const cursor = new Date();
        cursor.setHours(0, 0, 0, 0);

        // Allow today OR yesterday as the starting point so that a user who
        // hasn't answered anything yet today doesn't lose their streak.
        const toKey = (d: Date) => d.toISOString().slice(0, 10);

        // If the user answered something today, start counting from today;
        // otherwise start from yesterday.
        if (!uniqueDays.has(toKey(cursor))) {
          cursor.setDate(cursor.getDate() - 1);
        }

        while (uniqueDays.has(toKey(cursor))) {
          study_streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        }

        setStats({
          total_answered,
          practice_answered,
          timed_answered,
          today_count,
          accuracy_rate,
          study_streak,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load stats'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}