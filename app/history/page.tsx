'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
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

  const [user, setUser] = useState<any>(null);
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
    } catch (err: any) {
      setError(err.message || 'Failed to load exam history.');
    } finally {
      setLoading(false);
    }
  }, [user, examFilter, modeFilter, supabase]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={{ email: user.email || '', username: user.user_metadata?.username }} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exam History</h1>
          <p className="text-gray-500 mt-1">A record of every session you've completed.</p>
        </div>

        {!loading && !error && <SummaryBar sessions={sessions} />}

        <HistoryFilters 
          mode={modeFilter} setMode={setModeFilter} 
          exam={examFilter} setExam={setExamFilter} 
          count={sessions.length} 
        />

        {error && <div className="mb-6 p-4 bg-red-50 border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Loading your history...</p>
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((s, i) => <SessionRow key={s.id} session={s} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No sessions found.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}