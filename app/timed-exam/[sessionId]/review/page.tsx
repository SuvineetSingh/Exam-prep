'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AnswerReviewUI } from '@/components/timed-exam/AnswerReviewUI';

export default function ReviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [reviewData, setReviewData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFullReview = async () => {
      const supabase = createClient();
      
      const { data: session, error: sErr } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      const { data: answersData, error: aErr } = await supabase
        .from('exam_answers')
        .select(`
          user_choice,
          is_correct,
          question_id,
          questions (*)
        `)
        .eq('session_id', sessionId);

      if (sErr || aErr) {
        console.error("Supabase Error:", aErr || sErr);
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
            ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(session.created_at))
            : 'Recent Session'
        });
        
        const formatted = answersData.map((item: any) => {
          // Normalize the correct answer: handles "C", "(C)", or "c"
          const rawCorrect = item.questions?.correct_text || item.questions?.correct_option || "";
          const sanitizedCorrect = rawCorrect.replace(/[()]/g, "").trim().toUpperCase();

          return {
            ...item.questions,
            userAnswer: (item.user_choice || 'UNATTEMPTED').replace(/[()]/g, "").trim().toUpperCase(),
            correct_option: sanitizedCorrect
          };
        });
        
        setReviewData(formatted);
      }
      setLoading(false);
    };

    if (sessionId) fetchFullReview();
  }, [sessionId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-black text-blue-600 uppercase tracking-widest">
      Loading Review Data...
    </div>
  );

  return <AnswerReviewUI questions={reviewData} summary={summary} />;
}