'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatTime } from '@/lib/utils/helpers';
import { toggleStar, isQuestionStarred } from '@/lib/supabase/queries/starredQueries';
import type { Question } from '@/lib/types';
import { useGamification } from '@/hooks/useGamification';
import { batchAwardXP, type XPSource } from '@/lib/gamification/xpEngine';
import { checkAndAwardBadges, getEarnedBadgeKeys, buildBadgeContext } from '@/lib/gamification/badgeEngine';
import { useUserStats } from '@/hooks/useUserStats';
import { XPToast } from '@/components/gamification/XPToast';
import { BadgeModal } from '@/components/gamification/BadgeModal';
import { XP_CORRECT, XP_WRONG } from '@/lib/gamification/constants';

export interface QuestionLog {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface PracticeSessionUIProps {
  question: Question;
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
  questionNumber?: number;
  totalQuestions?: number;
  sessionLog: QuestionLog[];
  onLogUpdate: (updater: (prev: QuestionLog[]) => QuestionLog[]) => void;
}

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

        <div className="px-6 py-5 border-t border-slate-100 space-y-2">
          <button
            onClick={onSaveAndEnd}
            disabled={saving}
            className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-emerald-600 transition-colors shadow-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : log.length > 0 ? 'Save & End Session' : 'End Session'}
          </button>
          {log.length === 0 && (
            <p className="text-center text-[11px] text-slate-400">
              No answers to save — session will be discarded.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

function ExitConfirmModal({
  answeredCount,
  onStay,
  onExit,
}: {
  answeredCount: number;
  onStay: () => void;
  onExit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Exit Practice?</h3>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Your progress will <span className="font-bold text-red-500">not</span> be saved.
          {answeredCount > 0 && (
            <> You have answered <span className="font-bold text-slate-700">{answeredCount}</span> question{answeredCount !== 1 ? 's' : ''} that will be discarded.</>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onStay}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Stay
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-colors"
          >
            Exit & Discard
          </button>
        </div>
      </div>
    </div>
  );
}

function SaveExitModal({
  sessionLog,
  saving,
  onKeepPracticing,
  onSaveAndExit,
}: {
  sessionLog: QuestionLog[];
  saving: boolean;
  onKeepPracticing: () => void;
  onSaveAndExit: () => void;
}) {
  const correctCount = sessionLog.filter(e => e.isCorrect).length;
  const incorrectCount = sessionLog.filter(e => !e.isCorrect).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Save & End Session?</h3>
        <p className="text-slate-500 mb-2 leading-relaxed">
          This will save all <span className="font-bold text-slate-700">{sessionLog.length}</span> answered question{sessionLog.length !== 1 ? 's' : ''} to your history.
        </p>
        <div className="flex gap-3 mb-8">
          <div className="flex-1 text-center bg-slate-50 rounded-2xl py-3">
            <p className="text-xl font-black text-slate-700">{sessionLog.length}</p>
            <p className="text-[10px] font-bold uppercase text-slate-400">Attempted</p>
          </div>
          <div className="flex-1 text-center bg-emerald-50 rounded-2xl py-3">
            <p className="text-xl font-black text-emerald-600">{correctCount}</p>
            <p className="text-[10px] font-bold uppercase text-slate-400">Correct</p>
          </div>
          <div className="flex-1 text-center bg-red-50 rounded-2xl py-3">
            <p className="text-xl font-black text-red-500">{incorrectCount}</p>
            <p className="text-[10px] font-bold uppercase text-slate-400">Incorrect</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onKeepPracticing}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Keep Practicing
          </button>
          <button
            onClick={onSaveAndExit}
            disabled={saving}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save & Exit'}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  questionNumber,
  totalQuestions,
}: PracticeSessionUIProps) {
  const router   = useRouter();
  const supabase = createClient();

  const [showExitPopup, setShowExitPopup]         = useState(false);
  const [showSaveExitPopup, setShowSaveExitPopup] = useState(false);
  const [panelOpen, setPanelOpen]                 = useState(false);
  const [saving, setSaving]                       = useState(false);

  const [elapsed, setElapsed]         = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null);

  const [starred, setStarred]         = useState(false);
  const [starLoading, setStarLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const gamification = useGamification(currentUserId ?? undefined);
  const { stats } = useUserStats();

  // Track optimistic XP per answer for batch write on session end
  const pendingXpRef = useRef<{ source: XPSource; referenceId: string }[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setElapsed(0);
    setTimerActive(true);
    // Check star status for new question
    if (currentUserId && question?.id) {
      isQuestionStarred(currentUserId, Number(question.id)).then(setStarred);
    }
  }, [question?.id, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleStar = useCallback(async () => {
    if (!currentUserId || !question) return;
    setStarLoading(true);
    const next = !starred;
    setStarred(next);
    try {
      await toggleStar(currentUserId, Number(question.id), question.exam_type, !next);
    } catch {
      setStarred(!next); // revert on failure
    } finally {
      setStarLoading(false);
    }
  }, [currentUserId, question, starred]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerActive) {
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerActive]);

  const alreadyLogged = sessionLog.some(e => e.questionId === String(question.id));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isSubmitted) return;
      const key = e.key.toLowerCase();
      if (['a', 'b', 'c', 'd'].includes(key)) {
        setSelectedOption(key);
      } else if (e.key === 'Enter' && selectedOption) {
        document.getElementById('check-answer-btn')?.click();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isSubmitted, selectedOption, setSelectedOption]);

  const rawCorrectValue  = String(question.correct_answer || question.correct_option || '');
  const correctAnswerKey = rawCorrectValue.trim().toLowerCase();
  const isCorrect        = selectedOption?.toLowerCase() === correctAnswerKey;

  // Support both formats: DB uses option_a/b/c/d; legacy dummy data used options[]
  const optionsArray: string[] = (question.options?.length
    ? question.options
    : [question.option_a, question.option_b, question.option_c, question.option_d].filter(Boolean)
  ) as string[];
  const options = optionsArray.map((text: string, idx: number) => ({
    key: String.fromCharCode(97 + idx),
    text,
  }));

  // No DB write on check — answers persist to DB only when user ends session
  const handleCheckAnswer = useCallback(() => {
    if (!selectedOption) return;

    setTimerActive(false);
    const timeSpent = elapsed;
    setIsSubmitted(true);

    const correct = selectedOption.toLowerCase() === correctAnswerKey;
    const entry: QuestionLog = {
      questionId:     String(question.id),
      questionText:   question.question_text,
      selectedAnswer: selectedOption,
      isCorrect:      correct,
      timeSpent,
    };

    onLogUpdate(prev => {
      if (prev.find(e => e.questionId === String(question.id))) return prev;
      return [...prev, entry];
    });

    // Optimistic XP — show toast immediately
    if (!sessionLog.some(e => e.questionId === String(question.id))) {
      const source: XPSource = correct ? 'answer_correct' : 'answer_wrong';
      const xpAmount = correct ? XP_CORRECT : XP_WRONG;
      gamification.applyXP(xpAmount);
      gamification.addXPToast(xpAmount, correct ? `+${xpAmount} XP` : `+${xpAmount} XP`);
      pendingXpRef.current.push({ source, referenceId: String(question.id) });
    }
  }, [selectedOption, elapsed, question, correctAnswerKey, setIsSubmitted, onLogUpdate, sessionLog, gamification]);

  const handleNext = () => { setElapsed(0); setTimerActive(true); navigate('next'); };
  const handlePrev = () => { setElapsed(0); setTimerActive(true); navigate('prev'); };

  const handleExitDiscard = () => {
    if (sessionId) {
      try { sessionStorage.removeItem(`practice_log_${sessionId}`); } catch {}
    }
    router.push('/practice');
  };

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

      // Uses DB-generated UUID; URL sessionId is for sessionStorage keying only
      const { data: sessionData, error: sessionError } = await supabase
        .from('exam_sessions')
        .insert({
          user_id:            user.id,
          exam_type:          examFilter,
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

      const rows = sessionLog.map(entry => ({
        user_id:         user.id,
        question_id:     entry.questionId,
        exam_session_id: dbSessionId,
        selected_answer: entry.selectedAnswer.toUpperCase(),
        is_correct:      entry.isCorrect,
        mode:            'practice' as const,
        exam_type:       examFilter,
        time_spent:      entry.timeSpent,
      }));

      const { error: answersError } = await supabase
        .from('user_answers')
        .upsert(rows, { onConflict: 'exam_session_id,question_id' });

      if (answersError) throw answersError;

      // Batch-write XP transactions
      if (pendingXpRef.current.length > 0) {
        await batchAwardXP(user.id, pendingXpRef.current);
        pendingXpRef.current = [];
      }

      // Check for new badges
      const isPerfect = correctCount === sessionLog.length && sessionLog.length >= 5;
      const earnedKeys = await getEarnedBadgeKeys(user.id);
      const badgeCtx = await buildBadgeContext(user.id, stats?.study_streak ?? 0, {
        practiceSessionPerfect: isPerfect,
      });
      const newBadges = await checkAndAwardBadges({ userId: user.id, ...badgeCtx, earnedKeys });
      if (newBadges.length > 0) gamification.revealBadges(newBadges);

      if (sessionId) {
        try { sessionStorage.removeItem(`practice_log_${sessionId}`); } catch {}
      }

      if (newBadges.length === 0) router.push('/practice');
    } catch (err) {
      console.error('Failed to save session:', err);
      alert('Something went wrong while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [sessionLog, sessionId, examFilter, supabase, router, stats, gamification]);

  const timerColour = isSubmitted
    ? 'text-slate-400'
    : elapsed >= 60
    ? 'text-red-500'
    : elapsed >= 30
    ? 'text-amber-500'
    : 'text-slate-700';

  /* ── Progress bar pct ── */
  const answeredCount = sessionLog.length;
  const progressPct   = totalQuestions && totalQuestions > 0
    ? Math.round(((questionNumber ?? 1) - 1) / totalQuestions * 100)
    : 0;

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col relative">
      <XPToast toasts={gamification.toasts} />
      <BadgeModal
        badge={gamification.newBadges[0] ?? null}
        onDismiss={() => {
          gamification.dismissBadge();
          if (gamification.newBadges.length <= 1) router.push('/practice');
        }}
      />

      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        log={sessionLog}
        onSaveAndEnd={() => {
          setPanelOpen(false);
          if (sessionLog.length > 0) setShowSaveExitPopup(true);
          else setShowExitPopup(true);
        }}
        saving={saving}
      />

      {showExitPopup && (
        <ExitConfirmModal
          answeredCount={sessionLog.length}
          onStay={() => setShowExitPopup(false)}
          onExit={handleExitDiscard}
        />
      )}

      {showSaveExitPopup && (
        <SaveExitModal
          sessionLog={sessionLog}
          saving={saving}
          onKeepPracticing={() => setShowSaveExitPopup(false)}
          onSaveAndExit={handleSaveAndExit}
        />
      )}

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        {/* Progress bar */}
        {totalQuestions && (
          <div className="h-1.5 bg-neutral-100">
            <div
              className="h-full bg-brand-green transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Exit */}
          <button
            onClick={() => setShowExitPopup(true)}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors flex-shrink-0"
            title="Exit practice"
          >
            <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Question counter */}
          <div className="flex-1 text-center">
            {questionNumber != null && (
              <p className="text-sm font-extrabold text-neutral-700">
                {totalQuestions
                  ? `${questionNumber} / ${totalQuestions}`
                  : `Question ${questionNumber}`}
              </p>
            )}
          </div>

          {/* Right: timer + session */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1.5 font-mono font-bold text-sm transition-colors ${timerColour}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${timerActive && !isSubmitted ? 'bg-brand-green animate-pulse' : 'bg-neutral-300'}`} />
              {formatTime(elapsed)}
            </div>
            <button
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-full text-xs font-bold text-neutral-600 transition-colors"
            >
              📋
              {answeredCount > 0 && (
                <span className="w-4 h-4 bg-brand-green text-white rounded-full text-[10px] flex items-center justify-center font-black">
                  {answeredCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Question card ── */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-8">

        {/* Category + difficulty chips */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-bold px-3 py-1 bg-brand-amber/10 text-amber-700 rounded-full uppercase tracking-wide">
            {question.category || 'General'}
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${
            question.difficulty === 'hard'   ? 'bg-red-100 text-red-600'     :
            question.difficulty === 'medium' ? 'bg-amber-100 text-amber-600' :
                                               'bg-green-100 text-green-700'
          }`}>
            {question.difficulty || 'Easy'}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={handleToggleStar}
              disabled={starLoading || !currentUserId}
              title={starred ? 'Unstar this question' : 'Star for review'}
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-all disabled:opacity-40 ${
                starred ? 'text-brand-amber' : 'text-neutral-300 hover:text-brand-amber'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Question text */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-card p-6 mb-5">
          <p className="text-lg md:text-xl font-semibold text-neutral-900 leading-relaxed">
            {question.question_text}
          </p>
        </div>

        {/* Answer options */}
        <div className="space-y-3 mb-5">
          {options.map((opt) => {
            let cls = 'answer-option';
            if (isSubmitted) {
              if (opt.key === correctAnswerKey)    cls = 'answer-option answer-option-correct cursor-default';
              else if (selectedOption === opt.key) cls = `answer-option answer-option-wrong cursor-default ${!isCorrect ? 'animate-shake' : ''}`;
              else                                 cls = 'answer-option opacity-40 cursor-default pointer-events-none';
            } else if (selectedOption === opt.key) {
              cls = 'answer-option answer-option-selected';
            }

            const keyBg = isSubmitted
              ? opt.key === correctAnswerKey ? 'bg-brand-green text-white'
              : selectedOption === opt.key   ? 'bg-brand-coral text-white'
              : 'bg-neutral-200 text-neutral-400'
              : selectedOption === opt.key   ? 'bg-brand-green text-white'
              : 'bg-neutral-100 text-neutral-500';

            return (
              <button
                key={opt.key}
                disabled={isSubmitted}
                onClick={() => setSelectedOption(opt.key)}
                className={cls}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${keyBg}`}>
                  {opt.key.toUpperCase()}
                </span>
                <span className="font-semibold">{opt.text}</span>
                {isSubmitted && opt.key === correctAnswerKey && (
                  <span className="ml-auto text-brand-green text-lg">✓</span>
                )}
                {isSubmitted && selectedOption === opt.key && opt.key !== correctAnswerKey && (
                  <span className="ml-auto text-brand-coral text-lg">✕</span>
                )}
              </button>
            );
          })}
        </div>

        {alreadyLogged && !isSubmitted && (
          <div className="mb-3 px-4 py-2 bg-neutral-100 rounded-xl text-xs font-bold text-neutral-500 text-center">
            Already answered — re-selecting won&apos;t overwrite your logged answer.
          </div>
        )}

        {/* Submit / feedback */}
        {!isSubmitted ? (
          <button
            id="check-answer-btn"
            onClick={handleCheckAnswer}
            disabled={!selectedOption}
            className="btn-primary w-full py-4 text-base rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Check Answer
            {selectedOption && <span className="ml-2 text-sm opacity-70 font-normal">· Enter</span>}
          </button>
        ) : (
          <div className={`p-5 rounded-2xl border animate-slide-up ${
            isCorrect
              ? 'bg-green-50 border-brand-green/30'
              : 'bg-red-50 border-brand-coral/30'
          }`}>
            <p className={`font-extrabold text-base mb-2 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
              {isCorrect ? '🎉 Correct!' : '😬 Not quite — keep going!'}
            </p>
            {question.explanation ? (
              <p className="text-neutral-700 text-sm leading-relaxed">
                <span className="font-bold">Explanation: </span>{question.explanation}
              </p>
            ) : (
              <p className="text-neutral-400 text-sm italic">No explanation provided.</p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className="flex-1 py-3 px-4 bg-white border border-neutral-200 rounded-xl font-bold text-neutral-600 hover:bg-neutral-50 transition-all active:scale-95 disabled:opacity-25"
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            disabled={isLast}
            className="flex-1 py-3 px-4 bg-white border border-neutral-200 rounded-xl font-bold text-neutral-600 hover:bg-neutral-50 transition-all active:scale-95 disabled:opacity-25"
          >
            Next →
          </button>
        </div>

        <div className="mt-3">
          <button
            onClick={() =>
              sessionLog.length > 0
                ? setShowSaveExitPopup(true)
                : setShowExitPopup(true)
            }
            className="w-full py-3 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-400 font-bold text-sm hover:border-brand-green hover:text-brand-green hover:bg-green-50 transition-all"
          >
            {sessionLog.length > 0 ? '💾 Save & End Session' : '✕ End Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
