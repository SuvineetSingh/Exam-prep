'use client';

import React from 'react';
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
          ? 'Goal complete! Amazing work today.'
          : `${remaining} more question${remaining !== 1 ? 's' : ''} to hit your goal`}
      </p>
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────── */
function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">{label}</p>
        <span className="w-7 h-7 flex items-center justify-center text-neutral-400">{icon}</span>
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
  href: string; icon: React.ReactNode; label: string; sub: string; color: string;
}) {
  return (
    <Link
      href={href}
      className={`card-hover p-5 flex items-center gap-4 group cursor-pointer`}
    >
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
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
        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
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
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-neutral-500 mt-1 text-sm font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5">
            <svg className="w-6 h-6 text-amber-500 animate-streak-glow" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67z"/>
            </svg>
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
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>}
          label="Questions Answered"
          value={(stats?.total_answered ?? 0).toLocaleString()}
          sub={`+${stats?.today_count ?? 0} today`}
        />
        <StatCard
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>}
          label="Accuracy Rate"
          value={`${accuracyRate}%`}
          sub="Overall performance"
          color={scoreColor(accuracyRate)}
        />
        <StatCard
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>}
          label="Practice Mode"
          value={stats?.practice_answered ?? 0}
          sub="Questions answered"
        />
        <StatCard
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
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
            icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>}
            label="Practice Mode"
            sub="Unlimited questions, instant feedback"
            color="bg-green-100"
          />
          <ActionCard
            href="/timed-exam"
            icon={<svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            label="Timed Exam"
            sub="Simulate real exam conditions"
            color="bg-amber-100"
          />
          <ActionCard
            href="/questions"
            icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>}
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
            <svg className="w-10 h-10 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
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
