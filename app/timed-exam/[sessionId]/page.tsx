'use client';

import { useEffect, useState, useCallback, use, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ExamSessionUI } from '@/components/timed-exam/ExamSessionUI';
import { MINS_PER_QUESTION } from '@/lib/utils/constants';
import { batchAwardXP } from '@/lib/gamification/xpEngine';
import { checkAndAwardBadges, getEarnedBadgeKeys, buildBadgeContext } from '@/lib/gamification/badgeEngine';

export default function ExamPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const examContainerRef = useRef<HTMLDivElement>(null);
  const lastTickRef = useRef<number>(Date.now());
  // Stable ref so the timer interval never holds a stale handleSubmit closure
  const handleSubmitRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const examType = searchParams.get('type');
  const requestedCount = parseInt(searchParams.get('count') || '20');

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showCountWarning, setShowCountWarning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_type', examType)
          .limit(requestedCount);

        if (error) throw error;

        const fetchedQuestions = data || [];
        setQuestions(fetchedQuestions);

        const actualCount = fetchedQuestions.length;
        if (actualCount < requestedCount && actualCount > 0) {
          setShowCountWarning(true);
        }

        const savedTime = localStorage.getItem(`exam_timer_${sessionId}`);
        if (savedTime) {
          setTimeLeft(parseInt(savedTime));
        } else {
          const initialTime = actualCount * MINS_PER_QUESTION * 60;
          setTimeLeft(initialTime);
          localStorage.setItem(`exam_timer_${sessionId}`, initialTime.toString());
        }
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load exam questions.');
      } finally {
        setLoading(false);
      }
    };
    if (!examType) {
      setFetchError('No exam type specified. Please go back and try again.');
      setLoading(false);
      return;
    }
    fetchQuestions();
  }, [examType, requestedCount, supabase, sessionId]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasStarted && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasStarted, isSubmitting]);

  // Throttle localStorage writes — every 5 seconds instead of every tick
  useEffect(() => {
    if (hasStarted && !loading && timeLeft > 0 && timeLeft % 5 === 0) {
      localStorage.setItem(`exam_timer_${sessionId}`, timeLeft.toString());
    }
  }, [timeLeft, hasStarted, loading, sessionId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'u' || e.key === 's' || e.key === 'p' || e.key === 'r')) ||
        e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'R')
      ) {
        e.preventDefault();
        return false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const enterFullScreen = () => {
    if (examContainerRef.current) {
      const elem = examContainerRef.current;
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if ((elem as any).webkitRequestFullscreen) (elem as any).webkitRequestFullscreen();
      else if ((elem as any).msRequestFullscreen) (elem as any).msRequestFullscreen();
      setHasStarted(true);
      lastTickRef.current = Date.now();
    }
  };

  const exitFullScreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
  };

  const handleExitExam = useCallback(() => {
    localStorage.removeItem(`exam_timer_${sessionId}`);
    exitFullScreen();
    router.back();
  }, [sessionId, router]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    exitFullScreen();
    localStorage.removeItem(`exam_timer_${sessionId}`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated to save results.');

      const totalAnswered = Object.keys(userAnswers).length;
      const totalUnanswered = questions.length - totalAnswered;
      let correctCount = 0;

      const answerRows = questions.map(q => {
        const userChoice = userAnswers[q.id] || 'UNATTEMPTED';
        const isCorrect = userChoice === String(q.correct_option || q.correct_answer).toUpperCase();
        if (isCorrect) correctCount++;
        return {
          user_id: user.id,
          question_id: q.id,
          exam_session_id: sessionId,
          selected_answer: userChoice,
          is_correct: isCorrect,
          mode: 'timed',
          exam_type: examType,
          time_spent: 0,
        };
      });

      const actualCount = questions.length;
      const totalAllowedSeconds = actualCount * MINS_PER_QUESTION * 60;
      const timeSpent = totalAllowedSeconds - timeLeft;

      const { error: sErr } = await supabase.from('exam_sessions').insert({
        id: sessionId,
        user_id: user.id,
        exam_type: examType,
        mode: 'timed',
        total_questions: actualCount,
        score: correctCount,
        percentage: Math.round((correctCount / actualCount) * 100),
        time_taken_seconds: timeSpent,
        total_time_given_seconds: totalAllowedSeconds,
        answered_count: totalAnswered,
        unanswered_count: totalUnanswered,
      });
      if (sErr) throw sErr;

      const { error: aErr } = await supabase.from('user_answers').insert(answerRows);
      if (aErr) throw aErr;

      // Award XP for timed exam (best-effort — don't block navigation)
      const isPerfect = correctCount === actualCount;
      try {
        const xpTxns: { source: 'answer_correct' | 'answer_wrong' | 'exam_complete' | 'perfect_bonus'; referenceId: string }[] = [
          ...questions.map(q => ({
            source: (userAnswers[q.id] === String(q.correct_option || q.correct_answer).toUpperCase()
              ? 'answer_correct' : 'answer_wrong') as 'answer_correct' | 'answer_wrong',
            referenceId: String(q.id),
          })),
          { source: 'exam_complete' as const, referenceId: sessionId },
          ...(isPerfect ? [{ source: 'perfect_bonus' as const, referenceId: sessionId }] : []),
        ];
        await batchAwardXP(user.id, xpTxns);

        // buildBadgeContext fetches the real answer counts; streak passed as 0 here since
        // the timed-exam page doesn't load userStats — badge engine handles its own DB reads
        const earnedKeys = await getEarnedBadgeKeys(user.id);
        const badgeCtx = await buildBadgeContext(user.id, 0, { timedExamPerfect: isPerfect });
        await checkAndAwardBadges({ userId: user.id, ...badgeCtx, earnedKeys });
      } catch (gamErr) {
        console.warn('XP/badge award failed (non-blocking):', gamErr);
      }

      router.push(`/timed-exam/results?session=${sessionId}`);
    } catch (err: any) {
      console.error('Submission failed:', err.message);
      setSubmitError(err.message || 'Submission failed. Please try again.');
      setIsSubmitting(false);
    }
  }, [isSubmitting, sessionId, examType, questions, userAnswers, timeLeft, router, supabase]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  useEffect(() => {
    if (loading || !hasStarted) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTickRef.current) / 1000;

      if (elapsed > 180) {
        clearInterval(timer);
        handleExitExam();
        return;
      }

      lastTickRef.current = now;

      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => handleSubmitRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, hasStarted, handleExitExam]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-bold text-brand-green uppercase tracking-widest">
      Preparing Session...
    </div>
  );

  if (fetchError) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <p className="text-red-600 font-semibold">{fetchError}</p>
      <button onClick={() => window.history.back()} className="text-brand-green font-bold hover:underline">← Go Back</button>
    </div>
  );

  return (
    <div
      ref={examContainerRef}
      className="bg-neutral-100 h-screen w-full relative select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      {showCountWarning && (
        <div className="fixed inset-0 z-[300] bg-neutral-900/60 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-neutral-200">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-neutral-900 mb-2">Notice</h3>
            <p className="text-neutral-500 font-medium leading-relaxed mb-8">
              Only <span className="text-neutral-900 font-bold">{questions.length} questions</span> are available for <span className="text-brand-green font-bold">"{examType}"</span>. Your session has been adjusted accordingly.
            </p>
            <button
              onClick={() => setShowCountWarning(false)}
              className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-neutral-200 active:scale-95"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {!hasStarted && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-green-50 text-brand-green rounded-3xl flex items-center justify-center mb-6 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.247 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-neutral-900 mb-2">Ready to begin?</h2>
          <p className="text-neutral-500 mb-8 font-medium">Please review your session details below.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 w-full max-w-2xl">
            <div className="bg-neutral-100 p-5 rounded-2xl border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Exam Type</span>
              <span className="text-lg font-bold text-neutral-900 uppercase">{examType || 'Standard'}</span>
            </div>
            <div className="bg-neutral-100 p-5 rounded-2xl border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Questions</span>
              <span className="text-lg font-bold text-neutral-900">{questions.length} Items</span>
            </div>
            <div className="bg-neutral-100 p-5 rounded-2xl border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Duration</span>
              <span className="text-lg font-bold text-neutral-900">{Math.floor(questions.length * MINS_PER_QUESTION)} Mins</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-xs font-bold mb-8 border border-amber-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Screen will enter full-screen mode automatically
          </div>
          <button onClick={enterFullScreen} className="px-16 py-5 bg-brand-green text-white rounded-[2rem] font-black text-xl hover:bg-brand-green-dark shadow-2xl active:scale-95 flex items-center gap-3">
            Start Exam Now
          </button>
        </div>
      )}

      {hasStarted && (
        <ExamSessionUI
          questions={questions}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          userAnswers={userAnswers}
          setUserAnswers={setUserAnswers}
          timeLeft={timeLeft}
          formatTime={formatTime}
          isSubmitting={isSubmitting}
          submitError={submitError}
          modals={{
            showSummary: showSummaryModal,
            setShowSummary: setShowSummaryModal,
            showConfirm: showConfirmModal,
            setShowConfirm: setShowConfirmModal,
            showExit: showExitConfirm,
            setShowExit: setShowExitConfirm,
          }}
          onSubmit={handleSubmit}
          onExit={handleExitExam}
        />
      )}
    </div>
  );
}
