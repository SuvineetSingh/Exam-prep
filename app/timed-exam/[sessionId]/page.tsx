'use client';

import { useEffect, useState, useCallback, use, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ExamSessionUI } from '@/components/timed-exam/ExamSessionUI';

export default function ExamPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const examContainerRef = useRef<HTMLDivElement>(null);
  const lastTickRef = useRef<number>(Date.now());

  const examType = searchParams.get('type');
  const requestedCount = parseInt(searchParams.get('count') || '20');

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0); 
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showCountWarning, setShowCountWarning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

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
          const initialTime = actualCount * 1.5 * 60;
          setTimeLeft(initialTime);
          localStorage.setItem(`exam_timer_${sessionId}`, initialTime.toString());
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (examType) fetchQuestions();
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

  useEffect(() => {
    if (hasStarted && !loading && timeLeft > 0) {
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
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
      setHasStarted(true);
      lastTickRef.current = Date.now();
    }
  };

  const exitFullScreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const handleExitExam = useCallback(() => {
    localStorage.removeItem(`exam_timer_${sessionId}`);
    exitFullScreen();
    router.back();
  }, [sessionId, router]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return; 

    setIsSubmitting(true);
    exitFullScreen();
    localStorage.removeItem(`exam_timer_${sessionId}`);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User must be authenticated to save results.");

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
          time_spent: 0 
        };
      });

      const actualCount = questions.length;
      const totalAllowedSeconds = actualCount * 1.5 * 60;
      const timeSpent = totalAllowedSeconds - timeLeft;

      const { error: sErr } = await supabase.from('exam_sessions').insert({
        id: sessionId,
        user_id: user.id,
        exam_type: examType,
        total_questions: actualCount,
        score: correctCount,
        percentage: Math.round((correctCount / actualCount) * 100),
        time_taken_seconds: timeSpent,
        total_time_given_seconds: totalAllowedSeconds,
        answered_count: totalAnswered,
        unanswered_count: totalUnanswered
      });
      if (sErr) throw sErr;

      const { error: aErr } = await supabase.from('user_answers').insert(answerRows);
      if (aErr) throw aErr;

      router.push(`/timed-exam/results?session=${sessionId}`);
    } catch (err: any) {
      console.error("Submission failed:", err.message);
      alert(err.message);
      setIsSubmitting(false);
    }
  }, [isSubmitting, sessionId, examType, questions, userAnswers, timeLeft, router, supabase]);

  useEffect(() => {
    if (loading || !hasStarted || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsedSinceLastTick = (now - lastTickRef.current) / 1000;

      if (elapsedSinceLastTick > 180) {
        clearInterval(timer);
        alert("Exam terminated: Machine was inactive or in sleep mode for more than 3 minutes.");
        handleExitExam();
        return;
      }

      lastTickRef.current = now;

      setTimeLeft(prev => {
        if (prev <= 1) { 
          clearInterval(timer); 
          handleSubmit(); 
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, hasStarted, timeLeft, handleSubmit, handleExitExam]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // --- START COPIED LOGIC ---
  const answeredCount = Object.keys(userAnswers).length;
  const unattemptedCount = questions.length - answeredCount;
  // --- END COPIED LOGIC ---

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-bold text-blue-600 uppercase tracking-widest">
        Preparing Session...
    </div>
  );

  return (
    <div 
      ref={examContainerRef} 
      className="bg-gray-50 h-screen w-full relative select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      {showCountWarning && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Notice</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              The category <span className="text-blue-600 font-bold">"{examType}"</span> only has <span className="text-slate-900 font-bold">{questions.length} questions</span> available. We have adjusted your session accordingly.
            </p>
            <button 
              onClick={() => setShowCountWarning(false)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {!hasStarted && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.247 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-2">Ready to begin?</h2>
          <p className="text-gray-500 mb-8 font-medium">Please review your session details below.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 w-full max-w-2xl">
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Exam Type</span>
              <span className="text-lg font-bold text-gray-900 uppercase">{examType || 'Standard'}</span>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Questions</span>
              <span className="text-lg font-bold text-gray-900">{questions.length} Items</span>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Duration</span>
              <span className="text-lg font-bold text-gray-900">{Math.floor((questions.length * 1.5))} Mins</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-xs font-bold mb-8 border border-amber-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Note: Screen will enter full screen mode automatically
          </div>
          <button onClick={enterFullScreen} className="px-16 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl hover:bg-blue-700 shadow-2xl active:scale-95 flex items-center gap-3">
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
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isSubmitting={isSubmitting}
          modals={{
            showSummary: showSummaryModal,
            setShowSummary: setShowSummaryModal,
            showConfirm: showConfirmModal,
            setShowConfirm: setShowConfirmModal,
            showExit: showExitConfirm,
            setShowExit: setShowExitConfirm
          }}
          onSubmit={handleSubmit}
          onExit={handleExitExam}
        />
      )}
    </div>
  );
}