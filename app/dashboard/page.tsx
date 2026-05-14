'use client';

import { useUserStats } from '@/hooks/useUserStats';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SessionRow, type ExamSession } from '@/components/history/HistoryComponents';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function DashboardPage() {
  const { stats, loading, error } = useUserStats();
  const { user, loading: authLoading } = useRequireAuth();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [recentSessions, setRecentSessions] = useState<ExamSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    supabase
      .from('course_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setIsPremium((count ?? 0) > 0));

    supabase
      .from('exam_sessions')
      .select('id, exam_type, total_questions, score, percentage, time_taken_seconds, total_time_given_seconds, answered_count, unanswered_count, created_at, mode')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setRecentSessions((data ?? []) as ExamSession[]);
        setSessionsLoading(false);
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || authLoading || !user) {
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
        {isPremium === false && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-sm text-blue-800">
              <span className="text-xl">🎓</span>
              <span>
                <strong>You have 15 free questions per course.</strong>{' '}
                Upgrade to unlock unlimited access — CMA $59, CFA &amp; FE $49 each.
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back!
          </h1>
          <p className="text-gray-600">Here&apos;s your study progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            title="Questions Answered"
            value={stats?.total_answered ?? 0}
            subtitle={`+${stats?.today_count ?? 0} today`}
            icon="📊"
            iconBg="bg-blue-100"
          />
          <StatCard
            title="Accuracy Rate"
            value={`${stats?.accuracy_rate ?? 0}%`}
            subtitle="Overall performance"
            icon="✓"
            iconBg="bg-green-100"
          />
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

        <QuickActions />

        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900">Recent Tests</h2>
            <Link
              href="/history"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
            >
              View All History
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {sessionsLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-gray-400 text-sm font-medium">Loading history...</p>
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-gray-500 font-bold text-sm">No tests taken yet</p>
              <p className="text-gray-400 text-xs mt-1">Complete a practice or timed exam to see your history here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session, idx) => (
                <SessionRow key={session.id} session={session} index={idx} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
