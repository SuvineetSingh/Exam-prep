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
    return <div className="min-h-screen bg-neutral-100">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <Sidebar user={user} dailyAnswered={dailyAnswered} dailyGoal={dailyGoal} />
      <MobileTabBar />
      {/* Desktop: offset by sidebar width */}
      <main
        className="min-h-screen"
        style={{ marginLeft: 'var(--sidebar-width)' }}
      >
        <div className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
