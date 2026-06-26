'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useGamification } from '@/hooks/useGamification';
import { AppShell } from '@/components/layout/AppShell';
import { BadgeShelf } from '@/components/gamification/BadgeShelf';

export default function BadgesPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const gamification = useGamification(user?.id);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-500 font-medium text-sm">Loading your badges…</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Badges</h1>
        <p className="text-neutral-500 mt-1 text-sm font-medium">
          {gamification.earnedKeys.size} / 20 earned — keep practicing to unlock the rest.
        </p>
      </div>

      <BadgeShelf earnedKeys={gamification.earnedKeys} />
    </AppShell>
  );
}
