'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface QuestionLog {
  questionId: number;
  questionText: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // seconds
}

export interface PracticeSessionUIProps {
  question: any;
  selectedOption: string | null;
  setSelectedOption: (key: string) => void;
  isSubmitted: boolean;
  setIsSubmitted: (val: boolean) => void;
  isFirst: boolean;
  isLast: boolean;
  navigate: (dir: 'prev' | 'next') => void;
  sessionId: string;
  examFilter: string;
  categoryFilter: string;
  sessionLog: QuestionLog[];
  onLogUpdate: (updater: (prev: QuestionLog[]) => QuestionLog[]) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Side Panel
// ─────────────────────────────────────────────────────────────────────────────

function SidePanel({
  open,
  onClose,
  log,
  onSaveAndEnd,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  log: QuestionLog[];
  onSaveAndEnd: () => void;
  saving: boolean;
}) {
  const attempted = log.length;
  const correct   = log.filter(l => l.isCorrect).length;
  const incorrect = attempted - correct;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-80 z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
            Session Stats
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-3 px-6 py-5 border-b border-slate-100">
          <div className="text-center">
            <p className="text-2xl font-black text-slate-900">{attempted}</p>
            <p className="text-[10px] font-bold uppercase text-slate-400 mt-0.5">Attempted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-500">{correct}</p>
            <p className="text-[10px] font-bold uppercase text-slate-400 mt-0.5">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-red-500">{incorrect}</p>
            <p className="text-[10px] font-bold uppercase text-slate-400 mt-0.5">Incorrect</p>
          </div>
        </div>

        {/* Per-question log */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {log.length === 0 && (
            <p className="text-center text-slate-400 text-sm mt-8">
              No questions answered yet.
            </p>
          )}
          {log.map((entry, idx) => (
            <div
              key={`${entry.questionId}-${idx}`}
              className={`rounded-2xl border p-3 ${
                entry.isCorrect
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-bold text-slate-500">Q{idx + 1}</p>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    entry.isCorrect
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {entry.isCorrect ? '✓ Correct' : '✕ Wrong'}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                {entry.questionText}
              </p>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>
                  Answered:{' '}
                  <span className="text-slate-600">{entry.selectedAnswer.toUpperCase()}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>⏱</span>
                  {formatTime(entry.timeSpent)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Save & End */}
        <div className="px-6 py-5 border-t border-slate-100 space-y-2">
          <button
            onClick={onSaveAndEnd}
            disabled={saving || log.length === 0}
            className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-emerald-600 transition-colors shadow-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save & End Session'}
          </button>
          {log.length === 0 && (
            <p className="text-center text-[11px] text-slate-400">
              Answer at least one question to save.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function PracticeSessionUI({
  question,
  selectedOption,
  setSelectedOption,
  isSubmitted,
  setIsSubmitted,
  isFirst,
  isLast,
  navigate,
  sessionId,
  examFilter,
  sessionLog,
  onLogUpdate,
}: PracticeSessionUIProps) {
  const router   = useRouter();
  const supabase = createClient();

  const [showExitPopup, setShowExitPopup]         = useState(false);
  const [showSaveExitPopup, setShowSaveExitPopup] = useState(false);
  const [panelOpen, setPanelOpen]                 = useState(false);
  const [saving, setSaving]                       = useState(false);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const [elapsed, setElapsed]         = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setElapsed(0);
    setTimerActive(true);
  }, [question?.id]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerActive) {
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerActive]);

  // ── Answer derivation ─────────────────────────────────────────────────────
  const rawCorrectValue  = String(question.correct_answer || question.correct_option || '');
  const correctAnswerKey = rawCorrectValue.trim().toLowerCase();
  const isCorrect        = selectedOption?.toLowerCase() === correctAnswerKey;

  const options = [
    { key: 'a', text: question.option_a },
    { key: 'b', text: question.option_b },
    { key: 'c', text: question.option_c },
    { key: 'd', text: question.option_d },
  ];

  // ── Handle Check Answer (local-only, no DB write) ─────────────────────────
  const handleCheckAnswer = useCallback(() => {
    if (!selectedOption) return;

    setTimerActive(false);
    const timeSpent = elapsed;
    setIsSubmitted(true);

    const entry: QuestionLog = {
      questionId:     question.id,
      questionText:   question.question_text,
      selectedAnswer: selectedOption,
      isCorrect:      selectedOption.toLowerCase() === correctAnswerKey,
      timeSpent,
    };

    // Append to the parent's in-memory / sessionStorage log only —
    // nothing is written to the DB until the user explicitly saves.
    onLogUpdate(prev => {
      if (prev.find(e => e.questionId === question.id)) return prev;
      return [...prev, entry];
    });
  }, [selectedOption, elapsed, question, correctAnswerKey, setIsSubmitted, onLogUpdate]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = () => { setElapsed(0); setTimerActive(true); navigate('next'); };
  const handlePrev = () => { setElapsed(0); setTimerActive(true); navigate('prev'); };

  // ── Exit without saving ───────────────────────────────────────────────────
  const handleExitDiscard = () => {
    // Clear the sessionStorage log so nothing lingers
    if (sessionId) {
      try { sessionStorage.removeItem(`practice_log_${sessionId}`); } catch {}
    }
    router.push('/practice');
  };

  // ── Save all answers to DB then exit ─────────────────────────────────────
  const handleSaveAndExit = useCallback(async () => {
    if (sessionLog.length === 0) {
      router.push('/practice');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const correctCount = sessionLog.filter(e => e.isCorrect).length;
      const totalTime    = sessionLog.reduce((sum, e) => sum + e.timeSpent, 0);
      const pct          = Math.round((correctCount / sessionLog.length) * 100);

      // ── Step 1: create the exam_session row ──────────────────────────────
      // A fresh DB-generated UUID is used as the real FK anchor.
      // The client-side sessionId (from the URL) was only used for
      // sessionStorage keying and is not persisted to the DB.
      const { data: sessionData, error: sessionError } = await supabase
        .from('exam_sessions')
        .insert({
          user_id:            user.id,
          exam_type:          examFilter,   // e.g. 'CPA', 'CFA', 'FE'
          mode:               'practice',
          total_questions:    sessionLog.length,
          answered_count:     sessionLog.length,
          unanswered_count:   0,
          score:              correctCount,
          percentage:         pct,
          time_taken_seconds: totalTime,
        })
        .select('id')
        .single();

      if (sessionError) throw sessionError;

      const dbSessionId = sessionData.id;

      // ── Step 2: bulk-insert user_answers linked to that session ──────────
      const rows = sessionLog.map(entry => ({
        user_id:         user.id,
        question_id:     entry.questionId,
        exam_session_id: dbSessionId,
        selected_answer: entry.selectedAnswer.toUpperCase(),
        is_correct:      entry.isCorrect,
        mode:            'practice' as const,
        time_spent:      entry.timeSpent,
      }));

      const { error: answersError } = await supabase
        .from('user_answers')
        .upsert(rows, { onConflict: 'exam_session_id,question_id' });

      if (answersError) throw answersError;

      // ── Cleanup ───────────────────────────────────────────────────────────
      if (sessionId) {
        try { sessionStorage.removeItem(`practice_log_${sessionId}`); } catch {}
      }

      router.push('/practice');
    } catch (err) {
      console.error('Failed to save session:', err);
      alert('Something went wrong while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [sessionLog, sessionId, examFilter, supabase, router]);

  // ── Timer colour ──────────────────────────────────────────────────────────
  const timerColour = isSubmitted
    ? 'text-slate-400'
    : elapsed >= 60
    ? 'text-red-500'
    : elapsed >= 30
    ? 'text-amber-500'
    : 'text-slate-700';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 relative">

      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        log={sessionLog}
        onSaveAndEnd={() => { setPanelOpen(false); setShowSaveExitPopup(true); }}
        saving={saving}
      />

      {/* ── Exit (discard) confirmation ─────────────────────────────────── */}
      {showExitPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Exit Practice?</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Your progress will <span className="font-bold text-red-500">not</span> be saved.
              {sessionLog.length > 0 && (
                <> You have answered <span className="font-bold text-slate-700">{sessionLog.length}</span> question{sessionLog.length !== 1 ? 's' : ''} that will be discarded.</>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitPopup(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={handleExitDiscard}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-colors"
              >
                Exit & Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save & Exit confirmation ────────────────────────────────────── */}
      {showSaveExitPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Save & End Session?</h3>
            <p className="text-slate-500 mb-2 leading-relaxed">
              This will save all <span className="font-bold text-slate-700">{sessionLog.length}</span> answered question{sessionLog.length !== 1 ? 's' : ''} to your history.
            </p>
            {/* Mini summary */}
            <div className="flex gap-3 mb-8">
              <div className="flex-1 text-center bg-emerald-50 rounded-2xl py-3">
                <p className="text-xl font-black text-emerald-600">
                  {sessionLog.filter(e => e.isCorrect).length}
                </p>
                <p className="text-[10px] font-bold uppercase text-slate-400">Correct</p>
              </div>
              <div className="flex-1 text-center bg-red-50 rounded-2xl py-3">
                <p className="text-xl font-black text-red-500">
                  {sessionLog.filter(e => !e.isCorrect).length}
                </p>
                <p className="text-[10px] font-bold uppercase text-slate-400">Incorrect</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveExitPopup(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Keep Practicing
              </button>
              <button
                onClick={handleSaveAndExit}
                disabled={saving}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save & Exit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">

        {/* Top bar */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setShowExitPopup(true)}
            className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider"
          >
            ← EXIT PRACTICE
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-2">
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                {question.exam_type}
              </span>
              <span className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-bold text-blue-600 uppercase">
                {question.category || 'General'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm ${
                question.difficulty === 'hard'   ? 'bg-red-100 text-red-600'     :
                question.difficulty === 'medium' ? 'bg-amber-100 text-amber-600' :
                                                    'bg-emerald-100 text-emerald-600'
              }`}>
                {question.difficulty || 'Easy'}
              </span>
            </div>

            <button
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-black text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
            >
              <span>📋</span>
              <span>Session</span>
              {sessionLog.length > 0 && (
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] flex items-center justify-center font-black">
                  {sessionLog.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Question</p>
            <div className={`flex items-center gap-1.5 font-mono font-black text-sm transition-colors ${timerColour}`}>
              <span className={`w-2 h-2 rounded-full ${timerActive && !isSubmitted ? 'bg-green-400 animate-pulse' : 'bg-slate-300'}`} />
              {formatTime(elapsed)}
            </div>
          </div>

          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-8 leading-relaxed">
            {question.question_text}
          </h2>

          <div className="space-y-3">
            {options.map((opt) => {
              let containerStyle = 'border-slate-200 hover:border-blue-300';
              if (isSubmitted) {
                if (opt.key === correctAnswerKey)    containerStyle = 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500';
                else if (selectedOption === opt.key) containerStyle = 'border-red-500 bg-red-50 ring-1 ring-red-500';
                else                                 containerStyle = 'opacity-50 border-slate-100';
              } else if (selectedOption === opt.key) {
                containerStyle = 'border-blue-600 bg-blue-50 ring-1 ring-blue-600';
              }

              return (
                <button
                  key={opt.key}
                  disabled={isSubmitted}
                  onClick={() => setSelectedOption(opt.key)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${containerStyle}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    selectedOption === opt.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {opt.key.toUpperCase()}
                  </span>
                  <span className="font-medium text-slate-700">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {!isSubmitted ? (
            <button
              onClick={handleCheckAnswer}
              disabled={!selectedOption}
              className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-600 disabled:opacity-30 transition-all active:scale-[0.98]"
            >
              Check Answer
            </button>
          ) : (
            <div className={`mt-8 p-6 rounded-2xl border-l-4 ${
              isCorrect ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-500'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-black uppercase text-sm">
                  {isCorrect ? '✓ Correct Answer' : '✕ Incorrect'}
                </p>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  Time: {formatTime(elapsed)}
                </span>
              </div>
              <p className="text-slate-700 text-sm">
                <span className="font-bold">Explanation:</span> {question.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="mt-8 flex justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className="flex-1 py-3 px-6 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-25"
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            disabled={isLast}
            className="flex-1 py-3 px-6 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-25"
          >
            Next Question →
          </button>
        </div>

        {/* Save & End Session — bottom CTA */}
        <div className="mt-4">
          <button
            onClick={() => setShowSaveExitPopup(true)}
            disabled={sessionLog.length === 0}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 font-bold text-sm hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            💾 Save &amp; End Session
          </button>
        </div>
      </div>
    </div>
  );
}