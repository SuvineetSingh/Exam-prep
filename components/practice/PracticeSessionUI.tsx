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
import { QuestionView } from '@/components/question/QuestionView';
import { getCorrectKey } from '@/lib/utils/questionHelpers';

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
          className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-80 z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <h2 className="text-base font-black text-neutral-900 tracking-tight uppercase">
            Session Stats
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 px-6 py-5 border-b border-neutral-100">
          <div className="text-center">
            <p className="text-2xl font-black text-neutral-900">{attempted}</p>
            <p className="text-[10px] font-bold uppercase text-neutral-400 mt-0.5">Attempted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-green-500">{correct}</p>
            <p className="text-[10px] font-bold uppercase text-neutral-400 mt-0.5">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-red-500">{incorrect}</p>
            <p className="text-[10px] font-bold uppercase text-neutral-400 mt-0.5">Incorrect</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {log.length === 0 && (
            <p className="text-center text-neutral-400 text-sm mt-8">
              No questions answered yet.
            </p>
          )}
          {log.map((entry, idx) => (
            <div
              key={`${entry.questionId}-${idx}`}
              className={`rounded-2xl border p-3 ${
                entry.isCorrect
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-bold text-neutral-500">Q{idx + 1}</p>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    entry.isCorrect
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {entry.isCorrect ? '✓ Correct' : '✕ Wrong'}
                </span>
              </div>
              <p className="text-xs text-neutral-600 line-clamp-2 mb-2 leading-relaxed">
                {entry.questionText}
              </p>
              <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400">
                <span>
                  Answered:{' '}
                  <span className="text-neutral-600">{entry.selectedAnswer.toUpperCase()}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>⏱</span>
                  {formatTime(entry.timeSpent)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-5 border-t border-neutral-100 space-y-2">
          <button
            onClick={onSaveAndEnd}
            disabled={saving}
            className="w-full py-3.5 bg-neutral-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-brand-green transition-colors shadow-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : log.length > 0 ? 'Save & End Session' : 'End Session'}
          </button>
          {log.length === 0 && (
            <p className="text-center text-[11px] text-neutral-400">
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <h3 className="text-xl font-bold text-neutral-900 mb-2">Exit Practice?</h3>
        <p className="text-neutral-500 mb-8 leading-relaxed">
          Your progress will <span className="font-bold text-red-500">not</span> be saved.
          {answeredCount > 0 && (
            <> You have answered <span className="font-bold text-neutral-700">{answeredCount}</span> question{answeredCount !== 1 ? 's' : ''} that will be discarded.</>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onStay}
            className="flex-1 py-3 bg-neutral-100 text-neutral-600 rounded-xl font-bold hover:bg-neutral-200 transition-colors"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <h3 className="text-xl font-bold text-neutral-900 mb-2">Save & End Session?</h3>
        <p className="text-neutral-500 mb-2 leading-relaxed">
          This will save all <span className="font-bold text-neutral-700">{sessionLog.length}</span> answered question{sessionLog.length !== 1 ? 's' : ''} to your history.
        </p>
        <div className="flex gap-3 mb-8">
          <div className="flex-1 text-center bg-neutral-100 rounded-2xl py-3">
            <p className="text-xl font-black text-neutral-700">{sessionLog.length}</p>
            <p className="text-[10px] font-bold uppercase text-neutral-400">Attempted</p>
          </div>
          <div className="flex-1 text-center bg-green-50 rounded-2xl py-3">
            <p className="text-xl font-black text-brand-green">{correctCount}</p>
            <p className="text-[10px] font-bold uppercase text-neutral-400">Correct</p>
          </div>
          <div className="flex-1 text-center bg-red-50 rounded-2xl py-3">
            <p className="text-xl font-black text-red-500">{incorrectCount}</p>
            <p className="text-[10px] font-bold uppercase text-neutral-400">Incorrect</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onKeepPracticing}
            className="flex-1 py-3 bg-neutral-100 text-neutral-600 rounded-xl font-bold hover:bg-neutral-200 transition-colors"
          >
            Keep Practicing
          </button>
          <button
            onClick={onSaveAndExit}
            disabled={saving}
            className="flex-1 py-3 bg-brand-green text-white rounded-xl font-bold hover:bg-brand-green-dark shadow-lg shadow-green-200 transition-colors disabled:opacity-60"
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
  const savedSessionIdRef = useRef<string | null>(null);

  const [elapsed, setElapsed]         = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null);

  const [starred, setStarred]             = useState(false);
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
    const next = !starred;
    setStarred(next);
    try {
      await toggleStar(currentUserId, Number(question.id), question.exam_type, !next);
    } catch {
      setStarred(!next); // revert on failure
    }
  }, [currentUserId, question, starred]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerActive) {
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerActive]);

  // No DB write on check — answers persist to DB only when user ends session
  const handleCheckAnswer = useCallback(() => {
    if (!selectedOption) return;

    setTimerActive(false);
    const timeSpent = elapsed;
    setIsSubmitted(true);

    const correct = selectedOption === getCorrectKey(question);
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

    // Optimistic XP — show toast immediately; use ref to avoid stale-closure duplicate
    const alreadyPending = pendingXpRef.current.some(t => t.referenceId === String(question.id));
    if (!alreadyPending) {
      const source: XPSource = correct ? 'answer_correct' : 'answer_wrong';
      const xpAmount = correct ? XP_CORRECT : XP_WRONG;
      gamification.applyXP(xpAmount);
      gamification.addXPToast(xpAmount, `+${xpAmount} XP`);
      pendingXpRef.current.push({ source, referenceId: String(question.id) });
    }
  }, [selectedOption, elapsed, question, setIsSubmitted, onLogUpdate, gamification]);

  // If user selected an answer but navigated without clicking Check Answer, auto-log it
  const autoLogCurrentAnswer = useCallback(() => {
    if (!selectedOption || isSubmitted) return;
    const correct = selectedOption === getCorrectKey(question);
    const entry: QuestionLog = {
      questionId:     String(question.id),
      questionText:   question.question_text,
      selectedAnswer: selectedOption,
      isCorrect:      correct,
      timeSpent:      elapsed,
    };
    onLogUpdate(prev => {
      if (prev.find(e => e.questionId === String(question.id))) return prev;
      return [...prev, entry];
    });
    const alreadyPending = pendingXpRef.current.some(t => t.referenceId === String(question.id));
    if (!alreadyPending) {
      const source: XPSource = correct ? 'answer_correct' : 'answer_wrong';
      const xpAmount = correct ? XP_CORRECT : XP_WRONG;
      gamification.applyXP(xpAmount);
      gamification.addXPToast(xpAmount, `+${xpAmount} XP`);
      pendingXpRef.current.push({ source, referenceId: String(question.id) });
    }
  }, [selectedOption, isSubmitted, elapsed, question, onLogUpdate, gamification]);

  const handleNext = () => { autoLogCurrentAnswer(); setElapsed(0); setTimerActive(true); navigate('next'); };
  const handlePrev = () => { autoLogCurrentAnswer(); setElapsed(0); setTimerActive(true); navigate('prev'); };

  // Last question has no "next" to navigate to — offer to save & end instead
  // of leaving the primary action button permanently disabled.
  const handleFinish = () => {
    autoLogCurrentAnswer();
    setTimerActive(false);
    if (sessionLog.length > 0 || selectedOption) {
      setShowSaveExitPopup(true);
    } else {
      setShowExitPopup(true);
    }
  };

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
      savedSessionIdRef.current = dbSessionId;

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

      // Batch-write XP transactions. Derived from sessionLog (persisted in
      // sessionStorage by the parent page) rather than pendingXpRef, since
      // pendingXpRef resets to [] every time /practice/[id] remounts on
      // question navigation and would otherwise only contain the XP for
      // whichever question was active when the session was saved.
      const xpTxns: { source: XPSource; referenceId: string }[] = sessionLog.map(entry => ({
        source: entry.isCorrect ? 'answer_correct' : 'answer_wrong',
        referenceId: entry.questionId,
      }));
      if (xpTxns.length > 0) {
        await batchAwardXP(user.id, xpTxns);
        pendingXpRef.current = [];
      }

      // Check for new badges
      const isPerfect = correctCount === sessionLog.length && sessionLog.length >= 5;
      const earnedKeys = await getEarnedBadgeKeys(user.id);
      const badgeCtx = await buildBadgeContext(user.id, stats?.study_streak ?? 0, {
        practiceSessionPerfect: isPerfect,
      });
      const newBadges = await checkAndAwardBadges({ userId: user.id, ...badgeCtx, earnedKeys });

      if (sessionId) {
        try { sessionStorage.removeItem(`practice_log_${sessionId}`); } catch {}
      }

      if (newBadges.length > 0) {
        gamification.revealBadges(newBadges);
        // navigation happens in the BadgeModal onDismiss handler below
      } else {
        router.push(`/practice/results?session=${dbSessionId}`);
      }
    } catch (err) {
      console.error('Failed to save session:', err);
      alert('Something went wrong while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [sessionLog, sessionId, examFilter, supabase, router, stats, gamification]);

  const answeredCount = sessionLog.length;

  const timerSlot = (
    <div className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#FFD5C8] bg-[#FFF0ED]">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="#FF7C5C" strokeWidth="1.5" />
        <path d="M7 4.5v2.8l2 1.4" stroke="#FF7C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          timerActive && !isSubmitted ? 'bg-[#FF7C5C] animate-pulse' : 'bg-[#FF7C5C] opacity-40'
        }`}
      />
      <span className="font-mono font-extrabold text-[15px] text-[#FF7C5C] tabular-nums">
        {formatTime(elapsed)}
      </span>
    </div>
  );

  const headerExtra = (
    <>
      {/* Exit button */}
      <button
        onClick={() => setShowExitPopup(true)}
        className="w-8 h-8 rounded-full bg-brand-green-light hover:bg-brand-green-light flex items-center justify-center transition-colors"
        title="Exit practice"
      >
        <svg className="w-4 h-4 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Session stats panel */}
      <button
        onClick={() => setPanelOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-green-light hover:bg-brand-green-light rounded-full text-xs font-bold text-brand-green transition-colors"
        title="Session stats"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        {answeredCount > 0 && (
          <span className="w-4 h-4 bg-brand-green text-white rounded-full text-[10px] flex items-center justify-center font-black">
            {answeredCount}
          </span>
        )}
      </button>

      {/* Save / end session */}
      <button
        onClick={() => answeredCount > 0 ? setShowSaveExitPopup(true) : setShowExitPopup(true)}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-bold border border-neutral-200 bg-white text-neutral-600 hover:border-brand-green hover:text-brand-green hover:bg-brand-green-light transition-all"
      >
        {answeredCount > 0 ? 'Save & Exit' : 'End'}
      </button>
    </>
  );

  return (
    <>
      <XPToast toasts={gamification.toasts} />
      <BadgeModal
        badge={gamification.newBadges[0] ?? null}
        onDismiss={() => {
          const remaining = gamification.newBadges.length;
          gamification.dismissBadge();
          if (remaining <= 1) {
            router.push(
              savedSessionIdRef.current
                ? `/practice/results?session=${savedSessionIdRef.current}`
                : '/practice'
            );
          }
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

      <QuestionView
        question={question}
        showSubmitButton={true}
        showExplanation={true}
        lockAfterSubmit={true}
        fireSelectImmediately={false}
        selectedOption={selectedOption}
        onOptionSelect={setSelectedOption}
        isSubmitted={isSubmitted}
        onSubmit={handleCheckAnswer}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        onPrev={handlePrev}
        onNext={isLast ? handleFinish : handleNext}
        isFirst={isFirst}
        isLast={isLast}
        nextLabel={isLast ? 'Finish →' : undefined}
        isStarred={starred}
        onToggleStar={handleToggleStar}
        timerSlot={timerSlot}
        headerExtra={headerExtra}
      />
    </>
  );
}
