'use client';

import { useUserStats } from '@/hooks/useUserStats';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function DashboardPage() {
  const { stats, loading, error } = useUserStats();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        supabase
          .from('user_profiles')
          .select('is_premium')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setIsPremium(data?.is_premium ?? false));
      }
    }
    checkAuth();
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />


      <main className="max-w-6xl mx-auto px-4 py-8 pt-24">
        {/* ── Free-tier onboarding banner ───────────────────────────────── */}
        {isPremium === false && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-sm text-blue-800">
              <span className="text-xl">🎓</span>
              <span>
                <strong>You have 20 free questions per course.</strong>{' '}
                Upgrade once for $50 to unlock unlimited access to all CPA, CFA, and FE questions.
              </span>
            </div>
            <Link
              href="/courses"
              className="text-xs font-bold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              See all courses →
            </Link>
          </div>
        )}

        {/* ── Page heading ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back!
          </h1>
          <p className="text-gray-600">Here&apos;s your study progress</p>
        </div>

        {/* ── Row 1 — top-level stats (3 cards) ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/*
           * CHANGED: value now comes from stats.total_answered
           * (previously the hook didn't exist; now it queries
           *  user_answers WHERE selected_answer != 'UNATTEMPTED')
           */}
          <StatCard
            title="Questions Answered"
            value={stats?.total_answered ?? 0}
            subtitle={`+${stats?.today_count ?? 0} today`}
            icon="📊"
            iconBg="bg-blue-100"
          />

          {/*
           * UNCHANGED shape — accuracy_rate is now calculated in the hook
           * as: correct_count / total_answered * 100
           */}
          <StatCard
            title="Accuracy Rate"
            value={`${stats?.accuracy_rate ?? 0}%`}
            subtitle="Overall performance"
            icon="✓"
            iconBg="bg-green-100"
          />

          {/* UNCHANGED — streak logic moved into the hook */}
          <StatCard
            title="Study Streak"
            value={`${stats?.study_streak ?? 0} days`}
            subtitle={
              stats?.study_streak && stats.study_streak > 0
                ? 'Keep it up!'
                : 'Start today!'
            }
            icon="🔥"
            iconBg="bg-orange-100"
          />
        </div>

        {/* ── Row 2 — mode breakdown (NEW: 2 cards) ────────────────────── */}
        {/*
         * NEW SECTION: breaks down total_answered by mode
         * (practice vs timed) using the `mode` column in user_answers.
         * The `mode` column accepts: 'practice' | 'timed'
         */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            title="Practice Mode"
            value={stats?.practice_answered ?? 0}
            subtitle="Questions in practice mode"
            icon="📝"
            iconBg="bg-purple-100"
          />
          <StatCard
            title="Timed / Exam Mode"
            value={stats?.timed_answered ?? 0}
            subtitle="Questions in timed mode"
            icon="⏱️"
            iconBg="bg-yellow-100"
          />
        </div>

        {/* ── Quick actions (unchanged) ─────────────────────────────────── */}
        <QuickActions />
      </main>

      <Footer />
    </div>
  );
}