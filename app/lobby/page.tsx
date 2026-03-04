'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { fetchRooms, fetchUserProfile } from '@/lib/supabase/queries/lobbyQueries';
import { Header } from '@/components/layout/Header';
import { LobbyView } from '@/components/lobby/LobbyView';
import type { User } from '@supabase/supabase-js';
import type { LobbyRoom, LobbyUserProfile } from '@/lib/types/lobby';

export default function LobbyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<LobbyRoom[]>([]);
  const [userProfile, setUserProfile] = useState<LobbyUserProfile | null>(null);
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

      const [roomsData, profileData] = await Promise.all([
        fetchRooms(),
        fetchUserProfile(user.id),
      ]);

      setRooms(roomsData);
      setUserProfile(profileData);
      setLoading(false);
    }

    init();
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading lobby...</p>
      </div>
    );
  }

  const currentUser = {
    id: user.id,
    username: userProfile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'User',
    exam_type: userProfile?.exam_type || undefined,
    avatar_url: userProfile?.avatar_url || undefined,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <div className="pt-16">
        <LobbyView
          rooms={rooms}
          currentUser={currentUser}
          userProfile={userProfile}
        />
      </div>
    </div>
  );
}
