'use client';

import React from 'react';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface ExamSessionUIProps {
  questions: Question[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  userAnswers: Record<string, string>;
  setUserAnswers: (answers: Record<string, string>) => void;
  timeLeft: number;
  formatTime: (seconds: number) => string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isSubmitting: boolean;
  modals: {
    showSummary: boolean;
    setShowSummary: (show: boolean) => void;
    showConfirm: boolean;
    setShowConfirm: (show: boolean) => void;
    showExit: boolean;
    setShowExit: (show: boolean) => void;
  };
  onSubmit: () => void;
  onExit: () => void;
}

export function ExamSessionUI({
  questions,
  currentIndex,
  setCurrentIndex,
  userAnswers,
  setUserAnswers,
  timeLeft,
  formatTime,
  isSidebarOpen,
  setIsSidebarOpen,
  isSubmitting,
  modals,
  onSubmit,
  onExit
}: ExamSessionUIProps) {
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(userAnswers).length;
  const unattemptedCount = questions.length - answeredCount;

  return (
    <div 
      className="min-h-screen bg-gray-50 flex overflow-hidden relative select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      {/* Exit Confirm Modal */}
      {modals.showExit && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-2 border-red-50">
            <h3 className="text-xl font-black text-gray-900 mb-2 text-center">Exit Exam?</h3>
            <p className="text-gray-500 text-center mb-8 font-medium">Are you sure you want to exit? Your progress will not be saved.</p>
            <div className="flex gap-3">
              <button onClick={() => modals.setShowExit(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={onExit} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1st Popup: Summary */}
      {modals.showSummary && (
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
              <button onClick={() => modals.setShowSummary(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={() => { modals.setShowSummary(false); modals.setShowConfirm(true); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">Proceed</button>
            </div>
          </div>
        </div>
      )}

      {/* 2nd Popup: Confirm */}
      {modals.showConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-2 border-blue-100">
            <h3 className="text-xl font-black text-gray-900 mb-2 text-center">Ready to Submit?</h3>
            <p className="text-gray-500 text-center mb-8 font-medium">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => modals.setShowConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={onSubmit} disabled={isSubmitting} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Button in Corner */}
      <button 
        onClick={() => modals.setShowExit(true)}
        className="fixed top-6 right-6 z-50 p-2 px-4 bg-white/80 hover:bg-red-50 text-red-600 rounded-xl font-bold text-sm shadow-sm border border-red-100 transition-all flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Cancel Exam
      </button>

      {!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} className="fixed top-6 left-6 z-50 p-3 bg-white shadow-xl rounded-xl text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      )}

      <aside className={`bg-white border-r border-gray-100 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}`}>
        <div className="p-6 overflow-y-auto flex-1 min-w-[16rem]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Question Map</h3>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-10 rounded-lg font-bold text-sm border-2 transition-all ${currentIndex === idx ? 'border-blue-600 bg-blue-600 text-white shadow-lg' : !!userAnswers[q.id] ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
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
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-100"></div> Answered
              </div>
              <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-50"></div> Unattempted
              </div>
              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{unattemptedCount}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-3xl">
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className={!isSidebarOpen ? 'pl-14' : ''}>
              <span className="text-gray-400 text-xs font-bold uppercase block tracking-tighter">Exam Session</span>
              <span className="text-lg font-black text-gray-900">Q{currentIndex + 1} / {questions.length}</span>
            </div>
            <div className={`text-right p-2 px-6 rounded-xl border-2 transition-colors ${timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-blue-600 border-gray-100'}`}>
              <span className="text-[10px] font-bold uppercase block leading-none mb-1">Time Remaining</span>
              <span className="text-2xl font-black tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {currentQuestion && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-10 mb-6">
            <p className="text-xl font-bold text-gray-800 mb-8 leading-relaxed">{currentQuestion.question_text}</p>
            <div className="space-y-3">
              {['a', 'b', 'c', 'd'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setUserAnswers({ ...userAnswers, [currentQuestion.id]: opt.toUpperCase() })}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-bold flex items-center gap-4 ${userAnswers[currentQuestion.id] === opt.toUpperCase() ? 'border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-50' : 'border-gray-50 bg-gray-50 hover:border-gray-200 text-gray-600'}`}
                >
                   <span className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 font-black ${userAnswers[currentQuestion.id] === opt.toUpperCase() ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white'}`}>{opt.toUpperCase()}</span>
                   {currentQuestion[`option_${opt}` as keyof Question]}
                </button>
              ))}
            </div>
          </div>
          )}

          <div className="flex justify-between items-center px-2">
            <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)} className="px-8 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all active:scale-95 disabled:opacity-0 text-sm">Previous</button>
            {currentIndex === questions.length - 1 ? (
              <button onClick={() => modals.setShowSummary(true)} className="px-10 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all active:scale-95 text-sm">Finish Exam</button>
            ) : (
              <button onClick={() => setCurrentIndex(currentIndex + 1)} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 text-sm">Next Question</button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}