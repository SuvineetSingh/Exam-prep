'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { fetchUserProfile } from '@/lib/supabase/queries/lobbyQueries';
import type { User } from '@supabase/supabase-js';
import type { LobbyUserProfile, SettingsTab } from '@/lib/types';
import { AppShell } from '@/components/layout/AppShell';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { LobbyPreferencesTab } from '@/components/settings/LobbyPreferencesTab';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<LobbyUserProfile | null>(null);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      const [profile, proRes] = await Promise.all([
        fetchUserProfile(user.id),
        fetch('/api/me/pro').then(r => r.json()),
      ]);

      setUserProfile(profile);
      setIsPro(proRes.isPro ?? false);
      setLoading(false);
    }

    init();
  }, [router]);

  const handleRefreshProfile = async () => {
    if (!user) return;
    const profile = await fetchUserProfile(user.id);
    setUserProfile(profile);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Account Settings</h1>
          {isPro && (
            <span className="text-xs font-black uppercase tracking-wider bg-brand-amber text-white px-2.5 py-1 rounded-full">Pro</span>
          )}
        </div>
        <p className="text-neutral-500 text-sm">Manage your profile and preferences</p>
      </div>

      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'profile' && (
        <ProfileTab
          userId={user.id}
          userProfile={userProfile}
          onUpdate={handleRefreshProfile}
          authProvider={user.app_metadata?.provider}
        />
      )}

      {activeTab === 'preferences' && (
        <LobbyPreferencesTab
          userId={user.id}
          userProfile={userProfile}
          onUpdate={handleRefreshProfile}
        />
      )}
    </AppShell>
  );
}
