'use client';

import { useState } from 'react';
import type { Question } from '@/lib/types';
import { QuestionView } from '@/components/question/QuestionView';

interface ExamSessionUIProps {
  questions: Question[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  userAnswers: Record<string, string>;   // question id → lowercase 'a'|'b'|'c'|'d'
  setUserAnswers: (answers: Record<string, string>) => void;
  timeLeft: number;
  formatTime: (seconds: number) => string;
  isSubmitting: boolean;
  submitError: string | null;
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
  isSubmitting,
  submitError,
  modals,
  onSubmit,
  onExit,
}: ExamSessionUIProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const currentQuestion = questions[currentIndex];
  const answeredCount   = Object.keys(userAnswers).length;
  const unattemptedCount = questions.length - answeredCount;

  const timerCritical = timeLeft < 60;
  const timerWarning  = !timerCritical && timeLeft < 300;

  const timerSlot = (
    <div className={`flex items-center gap-1.5 px-4 py-2 rounded-full border font-mono font-extrabold tabular-nums text-[15px] transition-colors ${
      timerCritical ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' :
      timerWarning  ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      'bg-[#FFF0ED] text-[#FF7C5C] border-[#FFD5C8]'
    }`}>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 4.5v2.8l2 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {formatTime(timeLeft)}
    </div>
  );

  const secsPerQuestion = questions.length > 0 ? Math.round(timeLeft / questions.length) : 0;

  const statsSlot = (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4 text-[12px] font-semibold">
          <span className="flex items-center gap-1.5 text-brand-green">
            <span className="w-2 h-2 rounded-full bg-brand-green flex-shrink-0" />
            {answeredCount} answered
          </span>
          <span className="flex items-center gap-1.5 text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-brand-green-light flex-shrink-0" />
            {unattemptedCount} remaining
          </span>
        </div>
        <span className="text-[11px] text-neutral-300 hidden sm:block">~{secsPerQuestion}s / question</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {questions.map((q, idx) => {
          const isCurrent  = idx === currentIndex;
          const isAnswered = !!userAnswers[q.id];
          return (
            <button
              key={q.id}
              onClick={() => { setCurrentIndex(idx); setIsSidebarOpen(false); }}
              title={`Question ${idx + 1}`}
              className={`rounded-full flex-shrink-0 transition-all hover:scale-125 ${
                isCurrent
                  ? 'bg-brand-green'
                  : isAnswered
                  ? 'bg-brand-green'
                  : 'bg-brand-green-light'
              }`}
              style={{
                width:  isCurrent ? 13 : 9,
                height: isCurrent ? 13 : 9,
                boxShadow: isCurrent ? '0 0 0 2.5px #F3F0FC, 0 0 0 4.5px #6F56E5' : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );

  const headerExtra = (
    <>
      {/* Question map toggle (mobile / sidebar fallback) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-green-light hover:bg-brand-green-light rounded-full text-xs font-bold text-brand-green transition-colors"
        title="Question map"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="hidden sm:inline">Map</span>
        {answeredCount > 0 && (
          <span className="w-4 h-4 bg-brand-green text-white rounded-full text-[10px] flex items-center justify-center font-black">
            {answeredCount}
          </span>
        )}
      </button>

      {/* Cancel exam */}
      <button
        onClick={() => modals.setShowExit(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-bold text-red-500 bg-white border border-neutral-200 hover:bg-red-50 hover:border-red-200 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="hidden sm:inline">Cancel</span>
      </button>
    </>
  );

  return (
    <div
      className="relative select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      {/* ── Modals ─────────────────────────────────────────────── */}

      {modals.showExit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-2 border-red-50">
            <h3 className="text-xl font-black text-neutral-900 mb-2 text-center">Exit Exam?</h3>
            <p className="text-neutral-500 text-center mb-8 font-medium">Your progress will not be saved.</p>
            <div className="flex gap-3">
              <button onClick={() => modals.setShowExit(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-600 rounded-xl font-bold hover:bg-neutral-200 transition-colors">Cancel</button>
              <button onClick={onExit} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">Yes, Exit</button>
            </div>
          </div>
        </div>
      )}

      {modals.showSummary && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-neutral-900 mb-4">Exam Summary</h3>
            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center p-3 bg-neutral-100 rounded-xl">
                <span className="text-neutral-600 font-bold">Total Questions</span>
                <span className="font-black text-neutral-800">{questions.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                <span className="text-green-700 font-bold">Answered</span>
                <span className="font-black text-green-800">{answeredCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl">
                <span className="text-amber-700 font-bold">Unanswered</span>
                <span className="font-black text-amber-800">{unattemptedCount}</span>
              </div>
            </div>
            {unattemptedCount > 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-6 text-center font-medium">
                You have {unattemptedCount} unanswered question{unattemptedCount !== 1 ? 's' : ''}. They will be marked incorrect.
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => modals.setShowSummary(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-600 rounded-xl font-bold hover:bg-neutral-200 transition-colors">Keep Going</button>
              <button onClick={() => { modals.setShowSummary(false); modals.setShowConfirm(true); }} className="flex-1 py-3 bg-brand-green text-white rounded-xl font-bold hover:bg-brand-green-dark transition-colors">Submit</button>
            </div>
          </div>
        </div>
      )}

      {modals.showConfirm && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-2 border-green-100">
            <h3 className="text-xl font-black text-neutral-900 mb-2 text-center">Ready to Submit?</h3>
            <p className="text-neutral-500 text-center mb-8 font-medium">This action cannot be undone.</p>
            {submitError && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center font-medium">
                {submitError}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => modals.setShowConfirm(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-600 rounded-xl font-bold hover:bg-neutral-200 transition-colors" disabled={isSubmitting}>Cancel</button>
              <button onClick={onSubmit} disabled={isSubmitting} className="flex-1 py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : submitError ? 'Retry' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Question map sidebar (always fixed overlay) ─────── */}

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[140] bg-neutral-900/40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-neutral-200 shadow-sidebar z-[150] flex flex-col transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
      }`}>
        <div className="p-5 overflow-y-auto flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xs font-extrabold uppercase text-neutral-400 tracking-widest">Question Map</h3>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 transition-colors">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => { setCurrentIndex(idx); setIsSidebarOpen(false); }}
                className={`h-10 rounded-xl font-extrabold text-sm border-2 transition-all ${
                  currentIndex === idx
                    ? 'border-brand-green bg-brand-green text-white shadow-sm'
                    : !!userAnswers[q.id]
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-neutral-100 bg-neutral-50 text-neutral-400'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-2 border-t border-neutral-100 pt-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-neutral-400">
              <div className="w-3 h-3 rounded-md bg-brand-green" /> Current
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-neutral-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-md bg-green-50 border border-green-200" /> Answered
              </div>
              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-neutral-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-md bg-neutral-100" /> Unanswered
              </div>
              <span className="bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">{unattemptedCount}</span>
            </div>
          </div>

          <div className="mt-auto pt-5 border-t border-neutral-100">
            <button
              onClick={() => { setIsSidebarOpen(false); modals.setShowSummary(true); }}
              disabled={isSubmitting}
              className="btn-primary w-full py-3 justify-center disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting…' : 'Finish Exam'}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main question view ───────────────────────────────── */}

      {currentQuestion && (
        <QuestionView
          question={currentQuestion}
          showSubmitButton={false}
          showExplanation={false}
          lockAfterSubmit={false}
          fireSelectImmediately={true}
          selectedOption={userAnswers[currentQuestion.id] ?? null}
          onOptionSelect={(key) =>
            setUserAnswers({ ...userAnswers, [currentQuestion.id]: key })
          }
          isSubmitted={!!userAnswers[currentQuestion.id]}
          onSubmit={() => modals.setShowSummary(true)}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          onPrev={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          onNext={
            currentIndex === questions.length - 1
              ? () => modals.setShowSummary(true)
              : () => setCurrentIndex(currentIndex + 1)
          }
          isFirst={currentIndex === 0}
          isLast={false}
          nextLabel={currentIndex === questions.length - 1 ? 'Finish Exam →' : undefined}
          timerSlot={timerSlot}
          statsSlot={statsSlot}
          headerExtra={headerExtra}
        />
      )}

      {/* Submission error outside modals */}
      {submitError && !modals.showConfirm && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium shadow-lg">
          {submitError} —{' '}
          <button onClick={() => modals.setShowConfirm(true)} className="underline font-bold">Try again</button>
        </div>
      )}
    </div>
  );
}
