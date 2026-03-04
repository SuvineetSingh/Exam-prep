'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { fetchUserProfile } from '@/lib/supabase/queries/lobbyQueries';
import type { User } from '@supabase/supabase-js';
import type { LobbyUserProfile, SettingsTab } from '@/lib/types';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { SubscriptionTab } from '@/components/settings/SubscriptionTab';
import { LobbyPreferencesTab } from '@/components/settings/LobbyPreferencesTab';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<LobbyUserProfile | null>(null);
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

      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
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
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-6xl mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">
            Manage your profile, subscription, and preferences
          </p>
        </div>

        <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'profile' && (
          <ProfileTab
            userId={user.id}
            userProfile={userProfile}
            onUpdate={handleRefreshProfile}
          />
        )}

        {activeTab === 'subscription' && <SubscriptionTab />}

        {activeTab === 'preferences' && (
          <LobbyPreferencesTab
            userId={user.id}
            userProfile={userProfile}
            onUpdate={handleRefreshProfile}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
