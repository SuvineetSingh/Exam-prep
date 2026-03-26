'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { HistoryAnswerReviewUI } from '@/components/history/HistoryAnswerReviewUI';

export default function HistoryReviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();

  const [reviewData, setReviewData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReview = async () => {
      const supabase = createClient();

      // Auth guard
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      setUser(user);

      // 1. Session summary
      const { data: session, error: sErr } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      // 2. User answers joined with questions
      const { data: answersData, error: aErr } = await supabase
        .from('user_answers')
        .select(`
          selected_answer,
          is_correct,
          question_id,
          questions (*)
        `)
        .eq('exam_session_id', sessionId);

      if (sErr || aErr) {
        setError((aErr || sErr)?.message || 'Failed to load review.');
        setLoading(false);
        return;
      }

      if (session && answersData) {
        const spentMins = Math.floor((session.time_taken_seconds || 0) / 60);
        const spentSecs = (session.time_taken_seconds || 0) % 60;

        setSummary({
          ...session,
          timeFormatted: `${spentMins}m ${spentSecs}s`,
          dateFormatted: session.created_at
            ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(new Date(session.created_at))
            : 'Recent Session',
        });

        const formatted = answersData.map((item: any) => {
          const rawCorrect = item.questions?.correct_option || item.questions?.correct_answer || '';
          const sanitizedCorrect = rawCorrect.replace(/[()]/g, '').trim().toLowerCase();

          return {
            ...item.questions,
            userAnswer: (item.selected_answer || 'UNATTEMPTED').replace(/[()]/g, '').trim().toLowerCase(),
            correct_option: sanitizedCorrect,
          };
        });

        setReviewData(formatted);
      }

      setLoading(false);
    };

    if (sessionId) fetchReview();
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button onClick={() => router.back()} className="text-blue-600 font-bold hover:underline">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return <HistoryAnswerReviewUI questions={reviewData} summary={summary} user={user} />;
}