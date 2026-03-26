'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

interface HistoryAnswerReviewUIProps {
  questions: any[];
  summary: any;
  user?: any; // optional — passed from the page if available
}

// --- Helpers ---
const EXAM_COLORS: Record<string, string> = {
  CPA: 'bg-blue-600',
  CFA: 'bg-violet-600',
  FE:  'bg-teal-600',
};

const MODE_STYLE: Record<string, string> = {
  practice: 'bg-purple-50 text-purple-700 border-purple-200',
  timed:    'bg-yellow-50 text-yellow-700 border-yellow-200',
};

function getScoreColor(pct: number | null): string {
  if (pct == null) return 'text-gray-400';
  if (pct >= 75) return 'text-emerald-600';
  if (pct >= 50) return 'text-amber-600';
  return 'text-red-500';
}

function getScoreBg(pct: number | null): string {
  if (pct == null) return 'bg-gray-50 border-gray-200';
  if (pct >= 75) return 'bg-emerald-50 border-emerald-200';
  if (pct >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

// --- Review summary header ---
function ReviewSummary({ summary }: { summary: any }) {
  const pct = summary?.percentage ?? null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl ${EXAM_COLORS[summary?.exam_type] ?? 'bg-gray-500'} text-white flex items-center justify-center font-black text-base shadow`}>
            {summary?.exam_type}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{summary?.exam_type} Exam Review</h1>
            <p className="text-sm text-gray-400">{summary?.dateFormatted}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {summary?.mode && (
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${MODE_STYLE[summary.mode] ?? ''}`}>
              {summary.mode === 'timed' ? '⏱ Timed' : '📝 Practice'}
            </span>
          )}
          <Link
            href="/history"
            className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to History
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-xl border p-4 text-center ${getScoreBg(pct)}`}>
          <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide mb-1">Score</p>
          <p className={`text-3xl font-black ${getScoreColor(pct)}`}>{pct != null ? `${pct}%` : '—'}</p>
          {summary?.score != null && (
            <p className="text-xs text-gray-400 mt-0.5">{summary.score} / {summary.total_questions}</p>
          )}
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wide mb-1">Correct</p>
          <p className="text-3xl font-black text-emerald-700">{summary?.score ?? 0}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-[10px] font-bold uppercase text-amber-600 tracking-wide mb-1">Unanswered</p>
          <p className="text-3xl font-black text-amber-700">{summary?.unanswered_count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
          <p className="text-[10px] font-bold uppercase text-blue-600 tracking-wide mb-1">Time Taken</p>
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
    { key: 'all',        label: 'All',        color: 'bg-blue-600' },
    { key: 'correct',    label: 'Correct',    color: 'bg-emerald-600' },
    { key: 'incorrect',  label: 'Incorrect',  color: 'bg-red-500' },
    { key: 'unanswered', label: 'Unanswered', color: 'bg-amber-500' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-2 mb-6">
      {tabs.map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => setActive(key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            active === key ? `${color} text-white shadow` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {label}
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
            active === key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {counts[key]}
          </span>
        </button>
      ))}
    </div>
  );
}

// --- Single question card ---
function QuestionCard({ question, index }: { question: any; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const correctKey   = (question.correct_option || '').trim().toLowerCase();
  const selectedKey  = (question.userAnswer || '').trim().toLowerCase();
  const isCorrect    = selectedKey === correctKey;
  const isUnanswered = selectedKey === 'unattempted' || selectedKey === '';

  const statusColor = isCorrect
    ? 'border-emerald-200 bg-emerald-50/40'
    : isUnanswered
    ? 'border-gray-200 bg-gray-50/40'
    : 'border-red-200 bg-red-50/40';

  const iconStyle = isCorrect
    ? 'bg-emerald-100 text-emerald-600'
    : isUnanswered
    ? 'bg-gray-100 text-gray-400'
    : 'bg-red-100 text-red-500';

  const statusLabel = isCorrect ? 'Correct' : isUnanswered ? 'Unanswered' : 'Incorrect';
  const statusTextColor = isCorrect ? 'text-emerald-600' : isUnanswered ? 'text-gray-400' : 'text-red-500';

  return (
    <div className={`rounded-2xl border ${statusColor} overflow-hidden transition-all`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-white/60 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0 ${iconStyle}`}>
            {isCorrect ? '✓' : isUnanswered ? '?' : '✕'}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Question {index + 1}</p>
            <p className={`text-[10px] font-black uppercase tracking-wide ${statusTextColor}`}>{statusLabel}</p>
          </div>
        </div>

        {!expanded && (
          <p className="hidden md:block flex-1 mx-6 text-sm text-gray-500 truncate text-left">
            {question.question_text}
          </p>
        )}

        <svg
          width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          className={`flex-shrink-0 text-gray-300 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-6 pb-6 bg-white border-t border-gray-100">
          <p className="text-gray-800 font-semibold text-base leading-relaxed py-5">
            {question.question_text}
          </p>

          <div className="space-y-2.5 mb-5">
            {['a', 'b', 'c', 'd'].map((l) => {
              const isThisCorrect  = l === correctKey;
              const isThisSelected = l === selectedKey && !isUnanswered;

              let style = 'border-gray-200 bg-gray-50 text-gray-500';
              let badgeStyle = 'bg-white border border-gray-200 text-gray-400';

              if (isThisCorrect) {
                style = 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-400';
                badgeStyle = 'bg-emerald-500 text-white';
              } else if (isThisSelected) {
                style = 'border-red-400 bg-red-50 text-red-800 ring-1 ring-red-400';
                badgeStyle = 'bg-red-500 text-white';
              }

              return (
                <div key={l} className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 ${style}`}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${badgeStyle}`}>
                    {l.toUpperCase()}
                  </span>
                  <span className="font-medium text-sm">{question[`option_${l}`]}</span>
                  {isThisCorrect && (
                    <span className="ml-auto text-[10px] font-black uppercase text-emerald-600 tracking-wide">Correct Answer</span>
                  )}
                  {isThisSelected && !isCorrect && (
                    <span className="ml-auto text-[10px] font-black uppercase text-red-500 tracking-wide">Your Answer</span>
                  )}
                </div>
              );
            })}
          </div>

          {question.explanation && (
            <div className={`p-4 rounded-xl border-l-4 ${isCorrect ? 'bg-emerald-50 border-emerald-400' : 'bg-blue-50 border-blue-400'}`}>
              <p className="text-[10px] font-black uppercase tracking-wide text-gray-500 mb-1.5">Explanation</p>
              <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Main component ---
export function HistoryAnswerReviewUI({ questions, summary, user }: HistoryAnswerReviewUIProps) {
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* FIX: replaced hardcoded div navbar with real Header so ProfileDropdown works */}
      <Header
        user={{
          email: user?.email || summary?.user_email || '',
          username: user?.user_metadata?.username,
        }}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 pt-24">
        <ReviewSummary summary={summary} />
        <ReviewFilters active={filter} setActive={setFilter} counts={counts} />

        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((q, i) => (
              <QuestionCard key={q.id ?? i} question={q} index={questions.indexOf(q)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500 font-medium">No questions in this category.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}