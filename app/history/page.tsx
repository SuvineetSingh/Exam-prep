'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import type { User } from '@supabase/supabase-js';
import {
  ExamSession,
  FilterMode,
  FilterExam,
  SummaryBar,
  SessionRow,
  HistoryFilters
} from '@/components/history/HistoryComponents';

export default function HistoryPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modeFilter, setModeFilter] = useState<FilterMode>('all');
  const [examFilter, setExamFilter] = useState<FilterExam>('all');

  // Auth Protection
  useEffect(() => {
    async function initAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      setUser(user);
    }
    initAuth();
  }, [router, supabase]);

  // Data Fetching Logic
  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('exam_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (examFilter !== 'all') query = query.eq('exam_type', examFilter);
      if (modeFilter !== 'all') query = query.eq('mode', modeFilter);

      const { data, error } = await query;
      if (error) throw error;
      setSessions((data as ExamSession[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exam history.');
    } finally {
      setLoading(false);
    }
  }, [user, examFilter, modeFilter, supabase]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <AppShell user={user}>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Exam History</h1>
        <p className="text-neutral-500 mt-1 text-sm">A record of every session you&apos;ve completed.</p>
      </div>

      {!loading && !error && <SummaryBar sessions={sessions} />}

      <HistoryFilters
        mode={modeFilter} setMode={setModeFilter}
        exam={examFilter} setExam={setExamFilter}
        count={sessions.length}
      />

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

      {loading ? (
        <div className="card p-16 text-center">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 font-medium text-sm">Loading your history…</p>
        </div>
      ) : sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((s, i) => <SessionRow key={s.id} session={s} index={i} />)}
        </div>
      ) : (
        <div className="card p-16 text-center border-2 border-dashed border-neutral-200 bg-transparent shadow-none">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-neutral-500 font-bold text-sm mb-1">No sessions found</p>
          <p className="text-neutral-400 text-xs">Complete a practice or timed exam to see your history here.</p>
        </div>
      )}
    </AppShell>
  );
}