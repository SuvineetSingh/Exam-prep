'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchUnreadCounts } from '@/lib/supabase/queries/lobbyQueries';
import type { User } from '@supabase/supabase-js';
import { useUserActivity } from '@/hooks/useUserActivity';
import { useGamification } from '@/hooks/useGamification';
import { XPProgressBar } from '@/components/gamification/XPProgressBar';
import { UnreadBadge } from '@/components/lobby/UnreadBadge';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { useCart } from '@/lib/cart/CartContext';

/* ── Nav items ─────────────────────────────────────── */
const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/practice',
    label: 'Practice',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/timed-exam',
    label: 'Timed Exam',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/questions',
    label: 'Question Bank',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

/* ── DailyGoalBar ───────────────────────────────────── */
function DailyGoalBar({ answered, goal }: { answered: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, Math.round((answered / goal) * 100)) : 0;
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-neutral-500">Daily Goal</span>
        <span className="text-xs font-bold text-neutral-700">{answered}/{goal}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-neutral-400 mt-1 font-medium">
        {pct >= 100 ? 'Goal complete!' : `${goal - answered} more to hit your goal`}
      </p>
    </div>
  );
}

/* ── Avatar initials ────────────────────────────────── */
function Avatar({ email, size = 8 }: { email: string; size?: number }) {
  const initial = (email || 'U').charAt(0).toUpperCase();
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-gradient-to-tr from-brand-green to-brand-blue
                  flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
    >
      {initial}
    </div>
  );
}

/* ── Main Sidebar ───────────────────────────────────── */
interface SidebarProps {
  user: User;
  dailyAnswered?: number;
  dailyGoal?: number;
}

export function Sidebar({ user, dailyAnswered = 0, dailyGoal = 20 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{ rooms: Record<string, number>; dms: Record<string, number> }>({ rooms: {}, dms: {} });
  const [showTour, setShowTour] = useState(false);
  const gamification = useGamification(user.id);
  const cart = useCart();

  useUserActivity(user.id);

  useEffect(() => {
    fetch('/api/me/pro')
      .then(r => r.json())
      .then(({ isPro }: { isPro: boolean }) => setIsPremium(isPro))
      .catch(() => setIsPremium(false));
  }, [user.id]);

  useEffect(() => {
    fetchUnreadCounts(user.id).then(setUnreadCounts).catch(() => {});
  }, [user.id]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.username ||
    user.email?.split('@')[0] ||
    'You';

  const isLobbyActive = pathname === '/lobby' || pathname.startsWith('/lobby');
  const totalUnread =
    Object.values(unreadCounts.rooms).reduce((a, b) => a + b, 0) +
    Object.values(unreadCounts.dms).reduce((a, b) => a + b, 0);

  return (
    <aside
      className="fixed left-0 top-0 h-full bg-white border-r border-neutral-200 shadow-sidebar z-40
                 hidden md:flex flex-col"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* ── Brand logo ── */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-neutral-100">
        <div className="w-8 h-8 bg-brand-green rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <span className="text-base font-extrabold text-neutral-900 tracking-tight leading-tight">
          ExamPrep
        </span>
        {isPremium && (
          <span className="ml-auto text-[10px] font-black uppercase tracking-wider bg-brand-amber text-white px-2 py-0.5 rounded-full">
            Pro
          </span>
        )}
      </div>

      {/* ── Main nav ── */}
      <nav className="px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}
            >
              <span className={active ? 'text-brand-green' : 'text-neutral-400'}>
                {icon}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}

        <Link
          href="/lobby"
          className={`sidebar-item ${isLobbyActive ? 'sidebar-item-active' : ''}`}
        >
          <span className={isLobbyActive ? 'text-brand-green' : 'text-neutral-400'}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </span>
          <span>Community</span>
          <UnreadBadge count={totalUnread} />
        </Link>
      </nav>

      {/* ── XP mini-bar ── */}
      <div className="border-t border-neutral-100 px-4 py-3">
        <XPProgressBar totalXp={gamification.totalXp} compact />
      </div>

      {/* ── Daily goal progress ── */}
      <div className="border-t border-neutral-100">
        <DailyGoalBar answered={dailyAnswered} goal={dailyGoal} />
      </div>

      {/* ── Bottom: settings + profile ── */}
      <div className="border-t border-neutral-100 px-3 py-3 space-y-1">
        <Link
          href="/courses"
          className={`sidebar-item ${pathname === '/courses' ? 'sidebar-item-active' : ''}`}
        >
          <span className="text-neutral-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </span>
          <span>Courses</span>
        </Link>
        <Link
          href="/checkout"
          className={`sidebar-item ${pathname === '/checkout' ? 'sidebar-item-active' : ''}`}
        >
          <span className="text-neutral-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </span>
          <span>Cart</span>
          <UnreadBadge count={cart.items.length} />
        </Link>
        <Link
          href="/settings"
          className={`sidebar-item ${pathname === '/settings' ? 'sidebar-item-active' : ''}`}
        >
          <span className="text-neutral-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
          <span>Settings</span>
        </Link>
        <button onClick={() => setShowTour(true)} className="sidebar-item w-full text-left">
          <span className="text-neutral-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <span>Take the Tour</span>
        </button>

        {/* Profile row */}
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar email={user.email || ''} size={7} />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-neutral-800 truncate">{displayName}</p>
            <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-red-500 hover:bg-red-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>

      {showTour && <OnboardingTour userId={user.id} onComplete={() => setShowTour(false)} />}
    </aside>
  );
}

/* ── Mobile tab icons ───────────────────────────────── */
function TabIcon({ id }: { id: string }) {
  if (id === 'home')     return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  if (id === 'practice') return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
  if (id === 'exam')     return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  if (id === 'history')  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
  if (id === 'chat')     return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
  return null;
}

/* ── Mobile bottom tab bar ──────────────────────────── */
const MOBILE_TABS = [
  { href: '/dashboard', label: 'Home',     id: 'home'     },
  { href: '/practice',  label: 'Practice', id: 'practice' },
  { href: '/timed-exam',label: 'Exam',     id: 'exam'     },
  { href: '/history',   label: 'History',  id: 'history'  },
  { href: '/lobby',     label: 'Chat',     id: 'chat'     },
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 md:hidden">
      <div className="flex items-stretch">
        {MOBILE_TABS.map(({ href, label, id }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold
                          transition-colors ${active ? 'text-brand-green' : 'text-neutral-400'}`}
            >
              <TabIcon id={id} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
