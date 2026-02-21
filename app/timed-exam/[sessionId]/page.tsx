'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ExamSessionUI } from '@/components/timed-exam/ExamSessionUI';

export default function ExamPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const examType = searchParams.get('type');
  const questionCount = parseInt(searchParams.get('count') || '20');

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(questionCount * 1.5 * 60);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_type', examType)
          .limit(questionCount);
        if (error) throw error;
        setQuestions(data || []);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (examType) fetchQuestions();
  }, [examType, questionCount, supabase]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User must be authenticated to save results.");

      // Calculate Statistics
      const totalAnswered = Object.keys(userAnswers).length;
      const totalUnanswered = questions.length - totalAnswered;
      let correctCount = 0;

      const answerRows = questions.map(q => {
        const isCorrect = userAnswers[q.id] === String(q.correct_option || q.correct_answer).toUpperCase();
        if (isCorrect) correctCount++;
        return {
          session_id: sessionId,
          question_id: q.id,
          user_choice: userAnswers[q.id] || 'UNATTEMPTED',
          is_correct: isCorrect
        };
      });

      const totalAllowedSeconds = questionCount * 1.5 * 60;
      const timeSpent = totalAllowedSeconds - timeLeft;

      // Save Session Summary (With new columns)
      const { error: sErr } = await supabase.from('exam_sessions').insert({
        id: sessionId,
        user_id: user.id,
        exam_type: examType,
        total_questions: questions.length,
        score: correctCount,
        percentage: Math.round((correctCount / questions.length) * 100),
        time_taken_seconds: timeSpent,
        total_time_given_seconds: totalAllowedSeconds, // New column
        answered_count: totalAnswered,                   // New column
        unanswered_count: totalUnanswered                // New column
      });
      if (sErr) throw sErr;

      // Save Detailed Answers
      const { error: aErr } = await supabase.from('exam_answers').insert(answerRows);
      if (aErr) throw aErr;

      router.push(`/timed-exam/results?session=${sessionId}`);
    } catch (err: any) {
      console.error("Submission failed:", err.message);
      alert(err.message);
      setIsSubmitting(false);
    }
  }, [sessionId, examType, questions, userAnswers, timeLeft, questionCount, router, supabase]);

  useEffect(() => {
    if (loading || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, timeLeft, handleSubmit]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">
        LOADING EXAM...
    </div>
  );

  return (
    <ExamSessionUI
      questions={questions}
      currentIndex={currentIndex}
      setCurrentIndex={setCurrentIndex}
      userAnswers={userAnswers}
      setUserAnswers={setUserAnswers}
      timeLeft={timeLeft}
      formatTime={formatTime}
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      isSubmitting={isSubmitting}
      modals={{
        showSummary: showSummaryModal,
        setShowSummary: setShowSummaryModal,
        showConfirm: showConfirmModal,
        setShowConfirm: setShowConfirmModal,
      }}
      onSubmit={handleSubmit}
    />
  );
}