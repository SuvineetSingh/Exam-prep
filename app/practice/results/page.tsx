'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PracticeResultsUI } from '@/components/practice/PracticeResultsUI';

function ResultsContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const sessionId = searchParams.get('session');

  useEffect(() => {
    const fetchResult = async () => {
      const supabase = createClient();
      const { data: session } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (session) {
        const spentMins = Math.floor(session.time_taken_seconds / 60);
        const spentSecs = session.time_taken_seconds % 60;

        setData({
          ...session,
          timeFormatted: `${spentMins}m ${spentSecs}s`,
          dateFormatted: new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(session.created_at))
        });
      }
    };
    if (sessionId) fetchResult();
  }, [sessionId]);

  if (!data) return <div className="min-h-screen flex items-center justify-center font-bold">LOADING RESULTS...</div>;

  return (
    <PracticeResultsUI
      score={data.score}
      total={data.total_questions}
      percentage={data.percentage}
      timeTaken={data.timeFormatted}
      unanswered={data.unanswered_count}
      correct={data.score}
      incorrect={Math.max(0, data.answered_count - data.score)}
      examType={data.exam_type}
      date={data.dateFormatted}
      sessionId={data.id}
    />
  );
}

export default function ResultsPage() {
  return <Suspense><ResultsContent /></Suspense>;
}
