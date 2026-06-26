'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ExamSession } from '@/components/history/HistoryComponents';

interface ReviewQuestion {
  id: string;
  question_text: string;
  options: string[] | null;
  correct_option: string;
  correct_answer: string;
  explanation: string | null;
  exam_type: string;
  category: string | null;
  difficulty: string | null;
  userAnswer: string;
  [key: string]: unknown; // allow dynamic option_x access
}

interface HistoryAnswerReviewUIProps {
  questions: ReviewQuestion[];
  summary: ExamSession & { timeFormatted: string; dateFormatted: string };
}

// --- Helpers ---
const EXAM_COLORS: Record<string, string> = {
  CMA: 'bg-amber-600',
  CFA: 'bg-violet-600',
  FE:  'bg-teal-600',
};

const MODE_STYLE: Record<string, string> = {
  practice: 'mode-badge-practice',
  timed:    'mode-badge-timed',
};

function getScoreColor(pct: number | null): string {
  if (pct == null) return 'text-neutral-400';
  if (pct >= 75) return 'score-high';
  if (pct >= 50) return 'score-mid';
  return 'score-low';
}

function getScoreBg(pct: number | null): string {
  if (pct == null) return 'bg-neutral-100 border-neutral-200';
  if (pct >= 75) return 'bg-green-50 border-green-200';
  if (pct >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

// --- Review summary header ---
function ReviewSummary({ summary }: { summary: HistoryAnswerReviewUIProps['summary'] }) {
  const pct = summary?.percentage ?? null;

  return (
    <div className="card p-5 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl ${EXAM_COLORS[summary?.exam_type] ?? 'bg-neutral-500'} text-white flex items-center justify-center font-black text-base shadow flex-shrink-0`}>
            {summary?.exam_type}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">{summary?.exam_type} Exam Review</h1>
            <p className="text-sm text-neutral-400">{summary?.dateFormatted}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 print:hidden flex-wrap">
          {summary?.mode && (
            <span className={MODE_STYLE[summary.mode] ?? ''}>
              {summary.mode === 'timed' ? '⏱ Timed' : '📝 Practice'}
            </span>
          )}
          <button
            onClick={() => window.print()}
            title="Print this session"
            className="flex items-center gap-1.5 text-sm font-bold text-neutral-500 hover:text-brand-green transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className={`rounded-xl border p-4 text-center ${getScoreBg(pct)}`}>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-wide mb-1">Score</p>
          <p className={`text-3xl font-black ${getScoreColor(pct)}`}>{pct != null ? `${pct}%` : '—'}</p>
          {summary?.score != null && (
            <p className="text-xs text-neutral-400 mt-0.5">{summary.score} / {summary.total_questions}</p>
          )}
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <p className="text-[10px] font-bold uppercase text-brand-green tracking-wide mb-1">Correct</p>
          <p className="text-3xl font-black text-green-700">{summary?.score ?? 0}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-[10px] font-bold uppercase text-amber-600 tracking-wide mb-1">Unanswered</p>
          <p className="text-3xl font-black text-amber-700">{summary?.unanswered_count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
          <p className="text-[10px] font-bold uppercase text-brand-blue tracking-wide mb-1">Time Taken</p>
          <p className="text-2xl font-black text-blue-800 leading-tight">{summary?.timeFormatted ?? '—'}</p>
        </div>
      </div>
    </div>
  );
}

// --- Filter tabs ---
type ReviewFilter = 'all' | 'correct' | 'incorrect' | 'unanswered';

function ReviewFilters({ active, setActive, counts }: {
  active: ReviewFilter;
  setActive: (v: ReviewFilter) => void;
  counts: Record<ReviewFilter, number>;
}) {
  const tabs: { key: ReviewFilter; label: string; color: string }[] = [
    { key: 'all',        label: 'All',        color: 'bg-brand-green' },
    { key: 'correct',    label: 'Correct',    color: 'bg-brand-green' },
    { key: 'incorrect',  label: 'Incorrect',  color: 'bg-brand-coral' },
    { key: 'unanswered', label: 'Unanswered', color: 'bg-brand-amber' },
  ];

  return (
    <div className="card p-4 flex flex-wrap gap-2 mb-6">
      {tabs.map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => setActive(key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-btn text-xs font-bold transition-all ${
            active === key ? `${color} text-white shadow` : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
          }`}
        >
          {label}
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
            active === key ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'
          }`}>
            {counts[key]}
          </span>
        </button>
      ))}
    </div>
  );
}

// --- Single question card ---
function QuestionCard({ question, index }: { question: ReviewQuestion; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const correctKey   = (question.correct_option || question.correct_answer || '').trim().toLowerCase();
  const selectedKey  = (question.userAnswer || '').trim().toLowerCase();
  const OPTION_LETTERS = ['a', 'b', 'c', 'd'];
  const optionsArr: string[] = question.options?.length
    ? question.options
    : OPTION_LETTERS.map(l => String(question[`option_${l}`] ?? '')).filter(Boolean);
  const isCorrect    = selectedKey === correctKey;
  const isUnanswered = selectedKey === 'unattempted' || selectedKey === '';

  const statusColor = isCorrect
    ? 'border-green-200 bg-white'
    : isUnanswered
    ? 'border-neutral-200 bg-white'
    : 'border-red-200 bg-white';

  const iconStyle = isCorrect
    ? 'bg-green-100 text-brand-green'
    : isUnanswered
    ? 'bg-neutral-100 text-neutral-400'
    : 'bg-red-100 text-brand-coral';

  const statusLabel = isCorrect ? 'Correct' : isUnanswered ? 'Unanswered' : 'Incorrect';
  const statusTextColor = isCorrect ? 'text-brand-green' : isUnanswered ? 'text-neutral-400' : 'text-brand-coral';

  return (
    <div className={`rounded-card border ${statusColor} overflow-hidden transition-all`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/60 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0 ${iconStyle}`}>
            {isCorrect ? '✓' : isUnanswered ? '?' : '✕'}
          </div>
          <div>
            <p className="font-bold text-neutral-900 text-sm">Question {index + 1}</p>
            <p className={`text-[10px] font-black uppercase tracking-wide ${statusTextColor}`}>{statusLabel}</p>
          </div>
        </div>

        {!expanded && (
          <p className="hidden md:block flex-1 mx-6 text-sm text-neutral-500 truncate text-left">
            {question.question_text}
          </p>
        )}

        <div className="flex items-center gap-2 flex-shrink-0 print:hidden">
          <svg
            width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            className={`text-neutral-300 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 sm:px-6 pb-6 bg-white border-t border-neutral-100">
          <p className="text-neutral-800 font-semibold text-base leading-relaxed py-5">
            {question.question_text}
          </p>

          <div className="space-y-2.5 mb-5">
            {optionsArr.map((optText, idx) => {
              const l = OPTION_LETTERS[idx];
              if (!l) return null;
              const isThisCorrect  = l === correctKey;
              const isThisSelected = l === selectedKey && !isUnanswered;

              let style = 'border-neutral-200 bg-neutral-100 text-neutral-500';
              let badgeStyle = 'bg-white border border-neutral-200 text-neutral-400';

              if (isThisCorrect) {
                style = 'border-brand-green bg-green-50 text-green-800 ring-1 ring-brand-green';
                badgeStyle = 'bg-brand-green text-white';
              } else if (isThisSelected) {
                style = 'border-brand-coral bg-red-50 text-red-800 ring-1 ring-brand-coral';
                badgeStyle = 'bg-brand-coral text-white';
              }

              return (
                <div key={l} className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 ${style}`}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${badgeStyle}`}>
                    {l.toUpperCase()}
                  </span>
                  <span className="font-medium text-sm">{optText}</span>
                  {isThisCorrect && (
                    <span className="ml-auto text-[10px] font-black uppercase text-brand-green tracking-wide">Correct Answer</span>
                  )}
                  {isThisSelected && !isCorrect && (
                    <span className="ml-auto text-[10px] font-black uppercase text-brand-coral tracking-wide">Your Answer</span>
                  )}
                </div>
              );
            })}
          </div>

          {question.explanation && (
            <div className={`p-4 rounded-xl border-l-4 ${isCorrect ? 'bg-green-50 border-brand-green' : 'bg-blue-50 border-brand-blue'}`}>
              <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500 mb-1.5">Explanation</p>
              <p className="text-sm text-neutral-700 leading-relaxed">{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Main component ---
export function HistoryAnswerReviewUI({ questions, summary }: HistoryAnswerReviewUIProps) {
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const counts: Record<ReviewFilter, number> = {
    all:        questions.length,
    correct:    questions.filter(q => (q.userAnswer || '').toLowerCase() === (q.correct_option || '').toLowerCase()).length,
    incorrect:  questions.filter(q => {
      const sel = (q.userAnswer || '').toLowerCase();
      return sel !== (q.correct_option || '').toLowerCase() && sel !== 'unattempted' && sel !== '';
    }).length,
    unanswered: questions.filter(q => {
      const sel = (q.userAnswer || '').toLowerCase();
      return sel === 'unattempted' || sel === '';
    }).length,
  };

  const filtered = questions.filter(q => {
    const sel     = (q.userAnswer || '').toLowerCase();
    const correct = (q.correct_option || '').toLowerCase();
    const isUnanswered = sel === 'unattempted' || sel === '';
    if (filter === 'correct')    return sel === correct;
    if (filter === 'incorrect')  return sel !== correct && !isUnanswered;
    if (filter === 'unanswered') return isUnanswered;
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-100 py-8 sm:py-12 px-4">
      {/* Print styles: hide chrome, expand all cards */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
          .rounded-card { border-radius: 8px; }
          .shadow-card { box-shadow: none; }
        }
      `}</style>

      <main className="max-w-4xl mx-auto w-full">
        <Link href="/history" className="btn-danger px-4 py-2 text-xs mb-6 inline-flex print:hidden">
          ← Back to History
        </Link>
        <ReviewSummary summary={summary} />
        <ReviewFilters active={filter} setActive={setFilter} counts={counts} />

        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((q, i) => (
              <QuestionCard key={q.id ?? i} question={q} index={questions.indexOf(q)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 card border-2 border-dashed border-neutral-200">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-neutral-500 font-medium">No questions in this category.</p>
          </div>
        )}
      </main>
    </div>
  );
}