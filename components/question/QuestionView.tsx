'use client';

import { useEffect } from 'react';
import type { Question } from '@/lib/types';
import {
  getOptions,
  getCorrectKey,
  getDifficultyStyle,
  getExamTypeBadgeClass,
} from '@/lib/utils/questionHelpers';
import { cn } from '@/lib/utils/helpers';

export interface QuestionViewProps {
  question: Question;

  // Behavior flags — set at the call site, not derived from a mode string
  showSubmitButton: boolean;       // false in exam mode
  showExplanation: boolean;        // false in exam mode
  lockAfterSubmit: boolean;        // false in exam mode (answers stay changeable)
  fireSelectImmediately: boolean;  // true in exam mode (no explicit submit step)

  // Controlled answer state (always lifted to parent)
  selectedOption: string | null;   // lowercase 'a' | 'b' | 'c' | 'd'
  onOptionSelect: (key: string) => void;
  isSubmitted: boolean;
  onSubmit?: () => void;

  // Navigation
  questionNumber?: number;
  totalQuestions?: number;
  onPrev?: () => void;
  onNext?: () => void;
  isFirst?: boolean;
  isLast?: boolean;

  // Star toggle
  isStarred?: boolean;
  onToggleStar?: () => void;

  // Centered timer pill in header (practice: elapsed; exam: countdown)
  timerSlot?: React.ReactNode;

  // Stats + dot navigator strip between progress bar and content (exam only)
  statsSlot?: React.ReactNode;

  // Right-side header controls (exit button, stats panel, question map, etc.)
  headerExtra?: React.ReactNode;
}

export function QuestionView({
  question,
  showSubmitButton,
  showExplanation,
  lockAfterSubmit,
  fireSelectImmediately,
  selectedOption,
  onOptionSelect,
  isSubmitted,
  onSubmit,
  questionNumber,
  totalQuestions,
  onPrev,
  onNext,
  isFirst,
  isLast,
  isStarred,
  onToggleStar,
  timerSlot,
  statsSlot,
  headerExtra,
}: QuestionViewProps) {
  const options      = getOptions(question).map((text, idx) => ({ key: String.fromCharCode(97 + idx), text }));
  const correctKey   = getCorrectKey(question);
  const isCorrect    = isSubmitted ? selectedOption === correctKey : null;
  const diffStyle    = getDifficultyStyle(question.difficulty);
  const examBadgeCls = getExamTypeBadgeClass(question.exam_type);

  const progress =
    questionNumber != null && totalQuestions != null && totalQuestions > 0
      ? Math.round((questionNumber / totalQuestions) * 100)
      : null;

  // Keyboard shortcuts: A/B/C/D to select, Enter to submit
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (['a', 'b', 'c', 'd'].includes(key)) {
        const idx = key.charCodeAt(0) - 97;
        if (idx < options.length && (!lockAfterSubmit || !isSubmitted)) {
          onOptionSelect(key);
        }
      } else if (e.key === 'Enter' && showSubmitButton && selectedOption && !isSubmitted) {
        onSubmit?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [options.length, lockAfterSubmit, isSubmitted, showSubmitButton, selectedOption, onOptionSelect, onSubmit]);

  function getOptionClass(key: string): string {
    const isThisSelected = selectedOption === key;
    const isThisCorrect  = key === correctKey;

    if (isSubmitted && lockAfterSubmit) {
      if (isThisCorrect)   return 'answer-option answer-option-correct cursor-default';
      if (isThisSelected)  return cn('answer-option answer-option-wrong cursor-default', isCorrect === false && 'animate-shake');
      return 'answer-option opacity-40 cursor-default pointer-events-none';
    }

    return cn('answer-option', isThisSelected && 'answer-option-selected');
  }

  function getKeyBadgeClass(key: string): string {
    const isThisSelected = selectedOption === key;
    const isThisCorrect  = key === correctKey;

    if (isSubmitted && lockAfterSubmit) {
      if (isThisCorrect)  return 'bg-brand-green text-white';
      if (isThisSelected) return 'bg-brand-coral text-white';
      return 'bg-brand-violet-light text-neutral-400';
    }

    return isThisSelected
      ? 'bg-brand-violet text-white'
      : 'bg-brand-violet-light text-brand-violet';
  }

  const isOptionDisabled = (key: string) =>
    lockAfterSubmit && isSubmitted && key !== correctKey;

  return (
    <div className="min-h-screen bg-page-bg flex items-start justify-center md:py-10 md:px-4">
      <div
        className="w-full md:max-w-[820px] bg-white md:rounded-[20px] overflow-hidden"
        style={{ boxShadow: '0 8px 48px rgba(111,86,229,0.15), 0 2px 6px rgba(111,86,229,0.07)' }}
      >

        {/* ── Header ───────────────────────────────────────────── */}
        <div
          className="grid items-center px-5 md:px-7 border-b border-[#EAE5F8] bg-brand-violet-xlight"
          style={{ height: 56, gridTemplateColumns: '1fr auto 1fr' }}
        >
          {/* Col 1 — question counter */}
          <span className="text-sm md:text-[15px] font-extrabold text-neutral-900 tracking-tight whitespace-nowrap">
            {questionNumber != null ? (
              <>Question <strong>{questionNumber}</strong>{' '}
                <span className="font-medium text-neutral-400">of {totalQuestions}</span>
              </>
            ) : null}
          </span>

          {/* Col 2 — timer pill (always centered) */}
          <div className="flex justify-center">
            {timerSlot ?? null}
          </div>

          {/* Col 3 — difficulty badge + star + controls */}
          <div className="flex items-center gap-2 justify-end">
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
              {diffStyle.label}
            </span>

            {onToggleStar != null && (
              <button
                onClick={onToggleStar}
                title={isStarred ? 'Unstar this question' : 'Star for review'}
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-[10px] bg-brand-violet-light transition-colors hover:bg-[#DDD8F5]',
                  isStarred ? 'text-brand-amber' : 'text-brand-violet'
                )}
              >
                <svg width="15" height="17" viewBox="0 0 15 17" fill="none">
                  <path
                    d="M3 2h9a1 1 0 011 1v12l-5.5-3.2L2 15V3a1 1 0 011-1z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                    fill={isStarred ? 'currentColor' : 'none'}
                  />
                </svg>
              </button>
            )}

            {headerExtra && (
              <div className="flex items-center gap-2">{headerExtra}</div>
            )}
          </div>
        </div>

        {/* ── Progress bar ─────────────────────────────────────── */}
        {progress !== null && (
          <div className="h-1.5 bg-brand-violet-light">
            <div
              className="h-full rounded-r-[3px] transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #8B72F0, #6F56E5)',
              }}
            />
          </div>
        )}

        {/* ── Stats slot (exam dot navigator) ──────────────────── */}
        {statsSlot && (
          <div className="bg-[#FAFAFE] border-b border-[#EAE5F8] px-5 md:px-7 py-3">
            {statsSlot}
          </div>
        )}

        {/* ── Content ──────────────────────────────────────────── */}
        <div className="px-5 md:px-7 py-6 space-y-5">

          {/* Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={examBadgeCls}>{question.exam_type}</span>
            {question.category && (
              <div className="inline-flex items-center gap-1.5 bg-brand-violet-light rounded-[7px] px-3 py-1 text-[11px] font-bold text-brand-violet uppercase tracking-[0.06em]">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="1" width="10" height="10" rx="2" stroke="#6F56E5" strokeWidth="1.3" />
                  <path d="M3.5 4h5M3.5 6.5h3.5M3.5 9h4.5" stroke="#6F56E5" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                {question.category}
              </div>
            )}
          </div>

          {/* Question text */}
          <p className="text-lg md:text-[20px] font-bold text-neutral-900 leading-[1.65]">
            {question.question_text}
          </p>

          {/* Answer options */}
          <div className="flex flex-col gap-[11px]">
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  if (isOptionDisabled(opt.key)) return;
                  onOptionSelect(opt.key);
                }}
                disabled={isOptionDisabled(opt.key)}
                className={getOptionClass(opt.key)}
                style={{ borderRadius: 14, padding: '0 18px', gap: 14, minHeight: 62 }}
              >
                <span className={cn('answer-option-circle', getKeyBadgeClass(opt.key))}>
                  {opt.key.toUpperCase()}
                </span>

                <span className="font-medium flex-1 text-left text-[15px]">{opt.text}</span>

                {/* Checkmark circle on selected option before submit */}
                {!isSubmitted && selectedOption === opt.key && (
                  <span className="w-[26px] h-[26px] rounded-full bg-brand-violet flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                      <path d="M1.5 4.5L4.5 7.5L10.5 1.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}

                {/* Post-submit indicators */}
                {isSubmitted && lockAfterSubmit && opt.key === correctKey && (
                  <span className="ml-auto text-brand-green text-lg">✓</span>
                )}
                {isSubmitted && lockAfterSubmit && selectedOption === opt.key && opt.key !== correctKey && (
                  <span className="ml-auto text-brand-coral text-lg">✕</span>
                )}
              </button>
            ))}
          </div>

          {/* Explanation block (practice / browse only) */}
          {showExplanation && isSubmitted && (
            <div className={cn(
              'p-5 rounded-2xl border animate-slide-up',
              isCorrect
                ? 'bg-green-50 border-brand-green/30'
                : 'bg-red-50 border-brand-coral/30'
            )}>
              <p className={cn('font-extrabold text-base mb-2', isCorrect ? 'text-green-700' : 'text-red-600')}>
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
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 md:px-7 border-t border-[#EAE5F8] bg-brand-violet-xlight"
          style={{ minHeight: 62 }}
        >
          <button
            onClick={onPrev}
            disabled={!onPrev || isFirst}
            className="h-10 px-4 md:px-5 bg-white border-[1.5px] border-[#D6D0F0] rounded-[11px] text-sm font-semibold text-neutral-500 hover:bg-[#F7F5FF] hover:border-[#B8B0E8] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-3 py-3">
            {showSubmitButton && !isSubmitted && (
              <button
                id="qv-submit-btn"
                onClick={onSubmit}
                disabled={!selectedOption}
                className="btn-violet h-10 px-5 md:px-6 rounded-[11px] text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Check Answer
                {selectedOption && (
                  <span className="ml-1 text-sm opacity-70 font-normal hidden sm:inline">· Enter</span>
                )}
              </button>
            )}

            <button
              onClick={onNext}
              disabled={!onNext || isLast}
              className={cn(
                'h-10 px-4 md:px-6 rounded-[11px] text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed',
                showSubmitButton && !isSubmitted
                  ? 'bg-white text-brand-violet border-[1.5px] border-brand-violet hover:bg-brand-violet-light'
                  : 'btn-violet'
              )}
            >
              Next →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
