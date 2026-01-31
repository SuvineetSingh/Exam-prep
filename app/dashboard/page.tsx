'use client';

import { useUserStats } from '@/hooks/useUserStats';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const { stats, loading, error } = useUserStats();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    }
    checkAuth();
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={{ email: user.email || '', username: user.user_metadata?.username }} />
      
      <main className="max-w-6xl mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back!
          </h1>
          <p className="text-gray-600">
            Here&apos;s your study progress
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Questions Answered"
            value={stats?.total_answered || 0}
            subtitle={`+${stats?.today_count || 0} today`}
            icon="📊"
            iconBg="bg-blue-100"
          />
          <StatCard
            title="Accuracy Rate"
            value={`${stats?.accuracy_rate || 0}%`}
            subtitle="Overall performance"
            icon="✓"
            iconBg="bg-green-100"
          />
          <StatCard
            title="Study Streak"
            value={`${stats?.study_streak || 0} days`}
            subtitle={stats?.study_streak && stats.study_streak > 0 ? "Keep it up!" : "Start today!"}
            icon="🔥"
            iconBg="bg-orange-100"
          />
        </div>

        <QuickActions />
      </main>
      
      <Footer />
    </div>
  );
}
