'use client';

import { Sidebar, MobileTabBar } from './Sidebar';
import type { User } from '@supabase/supabase-js';

interface AppShellProps {
  user: User;
  children: React.ReactNode;
  dailyAnswered?: number;
  dailyGoal?: number;
  /** Pass true for immersive pages (practice, timed exam) that hide the sidebar */
  fullscreen?: boolean;
}

export function AppShell({
  user,
  children,
  dailyAnswered,
  dailyGoal,
  fullscreen = false,
}: AppShellProps) {
  if (fullscreen) {
    return <div className="min-h-screen bg-page-bg">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-page-bg">
      <Sidebar user={user} dailyAnswered={dailyAnswered} dailyGoal={dailyGoal} />
      <MobileTabBar />
      {/* Desktop: offset by sidebar width. Mobile: no offset, MobileTabBar is fixed at the bottom instead. */}
      <main className="min-h-screen md:ml-sidebar pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
