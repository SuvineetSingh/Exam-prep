'use client';

import { useUserStats } from '@/hooks/useUserStats';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useGamification } from '@/hooks/useGamification';
import { AppShell } from '@/components/layout/AppShell';
import { SessionRow, type ExamSession } from '@/components/history/HistoryComponents';
import { XPProgressBar } from '@/components/gamification/XPProgressBar';
import { BadgeShelf } from '@/components/gamification/BadgeShelf';
import { BadgeModal } from '@/components/gamification/BadgeModal';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

/* ── Helpers ───────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function scoreColor(pct: number) {
  if (pct >= 75) return 'text-green-600';
  if (pct >= 50) return 'text-amber-600';
  return 'text-red-500';
}

/* ── Daily Goal Progress Card ─────────────────────── */
function DailyGoalCard({ answered, goal }: { answered: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, Math.round((answered / goal) * 100)) : 0;
  const remaining = Math.max(0, goal - answered);
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-neutral-700">Today&apos;s Goal</p>
          <p className="text-2xl font-extrabold text-neutral-900 mt-0.5">
            {answered} <span className="text-neutral-400 text-lg font-semibold">/ {goal}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black" style={{ color: pct >= 100 ? '#58CC02' : '#FF9600' }}>
            {pct}%
          </p>
          <p className="text-xs text-neutral-400 font-medium">complete</p>
        </div>
      </div>
      <div className="progress-bar mb-2">
        <div className="progress-fill animate-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-neutral-500 font-medium">
        {pct >= 100
          ? '🎉 Goal complete! Amazing work today.'
          : `${remaining} more question${remaining !== 1 ? 's' : ''} to hit your goal`}
      </p>
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────── */
function StatCard({
  icon, label, value, sub, color,
}: {
  icon: string; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-3xl font-extrabold mt-1 ${color || 'text-neutral-900'}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-400 font-medium">{sub}</p>}
    </div>
  );
}

/* ── Quick Action Card ─────────────────────────────── */
function ActionCard({
  href, icon, label, sub, color,
}: {
  href: string; icon: string; label: string; sub: string; color: string;
}) {
  return (
    <Link
      href={href}
      className={`card-hover p-5 flex items-center gap-4 group cursor-pointer`}
    >
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-2xl flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-neutral-900 text-sm">{label}</p>
        <p className="text-xs text-neutral-500">{sub}</p>
      </div>
      <svg className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 transition-colors flex-shrink-0"
        fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

/* ── Premium Banner ────────────────────────────────── */
function PremiumBanner() {
  return (
    <div className="card p-4 border-brand-amber bg-amber-50 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🔒</span>
        <div>
          <p className="font-bold text-amber-900 text-sm">Unlock unlimited questions</p>
          <p className="text-xs text-amber-700">You&apos;re on the free tier — 15 questions per course</p>
        </div>
      </div>
      <Link
        href="/courses"
        className="text-xs font-bold px-4 py-2 bg-brand-amber hover:bg-orange-500 text-white rounded-xl transition-colors whitespace-nowrap"
      >
        Upgrade to Pro →
      </Link>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────── */
export default function DashboardPage() {
  const { stats, loading, error } = useUserStats();
  const { user, loading: authLoading } = useRequireAuth();
  const gamification = useGamification(user?.id);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [recentSessions, setRecentSessions] = useState<ExamSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const dailyGoal = 20;
  const dailyAnswered = stats?.today_count ?? 0;

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
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-500 font-medium text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.username ||
    user.email?.split('@')[0] ||
    'there';

  const accuracyRate = stats?.accuracy_rate ?? 0;
  const streak = stats?.study_streak ?? 0;

  return (
    <AppShell user={user} dailyAnswered={dailyAnswered} dailyGoal={dailyGoal}>
      <BadgeModal badge={gamification.newBadges[0] ?? null} onDismiss={gamification.dismissBadge} />

      {/* ── Welcome bar ── */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
            {getGreeting()}, {displayName} 👋
          </h1>
          <p className="text-neutral-500 mt-1 text-sm font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5">
            <span className="text-2xl animate-streak-glow">🔥</span>
            <div>
              <p className="text-sm font-extrabold text-amber-800">{streak} day streak!</p>
              <p className="text-[10px] text-amber-600 font-medium">Keep it going</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Premium banner ── */}
      {isPremium === false && (
        <div className="mb-6">
          <PremiumBanner />
        </div>
      )}

      {/* ── Daily goal ── */}
      <div className="mb-6">
        <DailyGoalCard answered={dailyAnswered} goal={dailyGoal} />
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="📊"
          label="Questions Answered"
          value={(stats?.total_answered ?? 0).toLocaleString()}
          sub={`+${stats?.today_count ?? 0} today`}
        />
        <StatCard
          icon="🎯"
          label="Accuracy Rate"
          value={`${accuracyRate}%`}
          sub="Overall performance"
          color={scoreColor(accuracyRate)}
        />
        <StatCard
          icon="⚡"
          label="Practice Mode"
          value={stats?.practice_answered ?? 0}
          sub="Questions answered"
        />
        <StatCard
          icon="⏱️"
          label="Timed Exams"
          value={stats?.timed_answered ?? 0}
          sub="Questions answered"
        />
      </div>

      {/* ── XP Progress ── */}
      <div className="mb-6">
        <XPProgressBar totalXp={gamification.totalXp} />
      </div>

      {/* ── Badges ── */}
      {gamification.earnedBadges.length > 0 && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-neutral-800">Your Badges</h2>
            <span className="text-xs font-bold text-neutral-400">{gamification.earnedBadges.length} / 20 earned</span>
          </div>
          <BadgeShelf earnedKeys={gamification.earnedKeys} compact />
        </div>
      )}

      {/* ── Quick actions ── */}
      <div className="mb-8">
        <h2 className="text-base font-extrabold text-neutral-800 mb-3">Quick Start</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ActionCard
            href="/practice"
            icon="⚡"
            label="Practice Mode"
            sub="Unlimited questions, instant feedback"
            color="bg-green-100"
          />
          <ActionCard
            href="/timed-exam"
            icon="⏱"
            label="Timed Exam"
            sub="Simulate real exam conditions"
            color="bg-amber-100"
          />
          <ActionCard
            href="/questions"
            icon="📚"
            label="Question Bank"
            sub="Browse & filter all questions"
            color="bg-blue-100"
          />
        </div>
      </div>

      {/* ── Recent sessions ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-neutral-800">Recent Tests</h2>
          <Link
            href="/history"
            className="text-xs font-bold text-brand-green hover:text-brand-green-dark transition-colors flex items-center gap-1"
          >
            View All
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {sessionsLoading ? (
          <div className="card p-8 text-center">
            <p className="text-neutral-400 text-sm font-medium">Loading history…</p>
          </div>
        ) : recentSessions.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-3xl mb-3">📋</p>
            <p className="font-bold text-neutral-700 text-sm mb-1">No tests taken yet</p>
            <p className="text-neutral-400 text-xs">Complete a practice or timed exam to see your results here.</p>
            <Link href="/practice" className="btn-primary mt-5 inline-flex">
              Start practicing →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((session, idx) => (
              <SessionRow key={session.id} session={session} index={idx} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
