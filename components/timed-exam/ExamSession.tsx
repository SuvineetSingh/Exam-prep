'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ExamQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
}

interface ExamSessionProps {
  sessionId: string;
}

export function ExamSession({ sessionId }: ExamSessionProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const examType = searchParams.get('type');
  const questionCount = parseInt(searchParams.get('count') || '20');

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(questionCount * 1.5 * 60);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const answeredCount = Object.keys(userAnswers).length;
  const unattemptedCount = questions.length - answeredCount;

  useEffect(() => {
    const fetchQuestions = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_type', examType)
        .limit(questionCount);

      if (!error) setQuestions(data || []);
      setLoading(false);
    };

    if (examType) fetchQuestions();
  }, [examType, questionCount]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    router.push(`/timed-exam/results?session=${sessionId}&type=${examType}`);
  }, [sessionId, examType, router]);

  useEffect(() => {
    if (loading || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, timeLeft, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Initialising Exam...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden relative">
      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 mb-4">Exam Summary</h3>
            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                <span className="text-emerald-700 font-bold">Answered</span>
                <span className="font-black text-emerald-800">{answeredCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-bold">Unanswered</span>
                <span className="font-black text-gray-800">{unattemptedCount}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSummaryModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={() => { setShowSummaryModal(false); setShowConfirmModal(true); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">Proceed</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-2 border-blue-100">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 text-center">Ready to Submit?</h3>
            <p className="text-gray-500 text-center mb-8 font-medium">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} className="fixed top-6 left-6 z-50 p-3 bg-white shadow-xl border border-gray-100 rounded-xl text-gray-600 hover:text-blue-600 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-100 transition-all duration-300 ease-in-out relative flex flex-col ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}`}>
        <div className="p-6 overflow-y-auto flex-1 min-w-[16rem]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Question Map</h3>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-10 rounded-lg font-bold text-sm transition-all border-2 ${
                  currentIndex === idx ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100'
                  : !!userAnswers[q.id] ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                  : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="mt-8 space-y-2 border-t border-gray-50 pt-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-400">
              <div className="w-3 h-3 rounded bg-blue-600"></div> Current
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-100"></div> Answered</div>
              <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-50"></div> Unattempted</div>
              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{unattemptedCount}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 relative">
        <div className="max-w-3xl mx-auto p-4 md:p-8">
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className={!isSidebarOpen ? 'pl-14' : ''}>
              <span className="text-gray-400 text-xs font-bold uppercase block tracking-tighter">Exam Session</span>
              <span className="text-lg font-black text-gray-900">
                Q{currentIndex + 1} <span className="text-gray-300 mx-1">/</span> {questions.length}
              </span>
            </div>
            <div className={`text-right p-2 px-6 rounded-xl border-2 transition-colors ${timeLeft < 60 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-gray-50 border-gray-100 text-blue-600'}`}>
              <span className="text-[10px] font-bold uppercase block leading-none mb-1">Time Remaining</span>
              <span className="text-2xl font-black tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-10 mb-6">
            <p className="text-xl font-bold text-gray-800 mb-8 leading-relaxed">{currentQuestion.question_text}</p>
            <div className="space-y-3">
              {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setUserAnswers({ ...userAnswers, [currentQuestion.id]: opt.toUpperCase() })}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-bold flex items-center gap-4 ${
                    userAnswers[currentQuestion.id] === opt.toUpperCase()
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-50'
                      : 'border-gray-50 bg-gray-50 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 font-black ${userAnswers[currentQuestion.id] === opt.toUpperCase() ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white'}`}>
                    {opt.toUpperCase()}
                  </span>
                  {currentQuestion[`option_${opt}` as keyof ExamQuestion]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center px-2">
            <button disabled={currentIndex === 0} onClick={() => setCurrentIndex((p) => p - 1)} className="px-8 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold shadow-md hover:bg-slate-300 transition-all active:scale-95 disabled:opacity-0 text-sm">
              Previous
            </button>
            {currentIndex === questions.length - 1 ? (
              <button onClick={() => setShowSummaryModal(true)} className="px-10 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-md hover:bg-black transition-all active:scale-95 text-sm">
                {isSubmitting ? 'Processing...' : 'Finish Exam'}
              </button>
            ) : (
              <button onClick={() => setCurrentIndex((p) => p + 1)} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95 text-sm">
                Next Question
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
