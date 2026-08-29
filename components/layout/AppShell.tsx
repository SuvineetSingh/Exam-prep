'use client';

import { useEffect, useState } from 'react';
import { Sidebar, MobileTabBar } from './Sidebar';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { fetchUserProfile } from '@/lib/supabase/queries/lobbyQueries';
import { fetchUserTags } from '@/lib/supabase/queries/tagQueries';
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
  const [tourMode, setTourMode] = useState<'full' | 'tags' | null>(null);

  useEffect(() => {
    Promise.all([fetchUserProfile(user.id), fetchUserTags(user.id)]).then(([profile, tags]) => {
      if (!profile) return;
      if (!profile.onboarding_completed) setTourMode('full');
      else if (tags.length < 5) setTourMode('tags');
    });
  }, [user.id]);

  const tour = tourMode && (
    <OnboardingTour userId={user.id} tagsOnly={tourMode === 'tags'} onComplete={() => setTourMode(null)} />
  );

  if (fullscreen) {
    return (
      <div className="min-h-screen bg-page-bg">
        {children}
        {tour}
      </div>
    );
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
      {tour}
    </div>
  );
}
