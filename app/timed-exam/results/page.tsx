'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ExamResultsUI } from '@/components/timed-exam/ExamResultsUI';

function ResultsContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const sessionId = searchParams.get('session');

  useEffect(() => {
    const fetchResult = async () => {
      const supabase = createClient();
      const { data: session, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (session) {
        // Formatting time spent
        const spentMins = Math.floor(session.time_taken_seconds / 60);
        const spentSecs = session.time_taken_seconds % 60;
        
        // Formatting total time allowed
        const allowedMins = Math.floor(session.total_time_given_seconds / 60);

        setData({
          ...session,
          timeFormatted: `${spentMins}m ${spentSecs}s`,
          allowedTimeFormatted: `${allowedMins} min`,
          dateFormatted: new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(session.created_at))
        });
      }
    };
    if (sessionId) fetchResult();
  }, [sessionId]);

  if (!data) return <div className="min-h-screen flex items-center justify-center font-bold">LOADING RESULTS...</div>;

  return (
    <ExamResultsUI 
      score={data.score}
      total={data.total_questions}
      percentage={data.percentage}
      timeTaken={data.timeFormatted}
      timeGiven={data.allowedTimeFormatted}
      answered={data.answered_count}
      unanswered={data.unanswered_count}
      examType={data.exam_type}
      date={data.dateFormatted}
      sessionId={data.id}
    />
  );
}

export default function ResultsPage() {
  return <Suspense><ResultsContent /></Suspense>;
}