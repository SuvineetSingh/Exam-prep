'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AnswerReviewUIProps {
  questions: any[];
  summary: any;
}

export function AnswerReviewUI({ questions, summary }: AnswerReviewUIProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-neutral-100 py-8 sm:py-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto">

        {/* --- HEADER SUMMARY BOX --- */}
        <div className="card p-6 sm:p-10 mb-8">
          <div className="flex justify-between items-start mb-8 flex-wrap gap-3">
             <div>
                <div className="mb-2 inline-block px-3 py-1 bg-green-100 text-brand-green rounded-full text-[10px] font-black uppercase tracking-widest">
                  {summary?.exam_type || 'Session'} Review
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 uppercase tracking-tighter">Answer Review</h1>
                <p className="text-neutral-400 font-bold text-sm">{summary?.dateFormatted}</p>
             </div>
             <Link href="/questions" className="text-xs font-bold text-neutral-400 hover:text-brand-green transition-colors uppercase tracking-widest">← Exit Review</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-purple-100 p-5 sm:p-6 rounded-card">
              <p className="text-[10px] font-black text-purple-900 uppercase mb-1 tracking-widest">Score</p>
              <p className="text-3xl font-black text-purple-700">{summary?.score ?? 0} <span className="text-purple-900 text-lg">/ {summary?.total_questions ?? 0}</span></p>
            </div>
            <div className="bg-green-50 p-5 sm:p-6 rounded-card border border-green-100">
              <p className="text-[10px] font-black text-brand-green uppercase mb-1 tracking-widest">Answered</p>
              <p className="text-3xl font-black text-green-700">{summary?.answered_count ?? 0}</p>
            </div>
            <div className="bg-amber-50 p-5 sm:p-6 rounded-card border border-amber-100">
              <p className="text-[10px] font-black text-amber-600 uppercase mb-1 tracking-widest">Unanswered</p>
              <p className="text-3xl font-black text-amber-700">{summary?.unanswered_count ?? 0}</p>
            </div>
            <div className="bg-blue-50 p-5 sm:p-6 rounded-card border border-blue-100">
              <p className="text-[10px] font-black text-brand-blue uppercase mb-1 tracking-widest">Time Taken</p>
              <p className="text-xl font-black text-blue-800 leading-tight">{summary?.timeFormatted}</p>
            </div>
          </div>
        </div>

        {/* --- QUESTIONS LIST --- */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const correctAnswerKey = (q.correct_option || q.correct_answer || "").trim().toLowerCase();
            const selectedOption = (q.userAnswer || "").trim().toLowerCase();
            const OPTION_LETTERS = ['a', 'b', 'c', 'd'];
            const optionsArr: string[] = q.options?.length
              ? q.options
              : OPTION_LETTERS.map((l: string) => q[`option_${l}`]).filter(Boolean);

            const isCorrect = selectedOption === correctAnswerKey;
            const isUnattempted = selectedOption === 'unattempted' || selectedOption === '';

            const isExpanded = expandedId === q.id || !isCorrect;

            return (
              <div key={q.id || idx} className="card overflow-hidden transition-all">
                <button
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  className="w-full p-5 sm:p-8 flex justify-between items-center text-left hover:bg-neutral-100/50 transition-colors"
                >
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0
                      ${isCorrect ? 'bg-green-100 text-brand-green' : isUnattempted ? 'bg-neutral-100 text-neutral-400' : 'bg-red-100 text-brand-coral'}`}>
                      {isCorrect ? '✓' : isUnattempted ? '?' : '✕'}
                    </div>
                    <div>
                        <span className="block font-black text-neutral-900 text-lg sm:text-xl tracking-tight">Question {idx + 1}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isCorrect ? 'text-brand-green' : isUnattempted ? 'text-neutral-400' : 'text-brand-coral'}`}>
                          {isCorrect ? 'Correct' : isUnattempted ? 'Unanswered' : 'Incorrect'}
                        </span>
                    </div>
                  </div>
                  <div className={`transform transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-neutral-300"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 sm:px-10 pb-6 sm:pb-10 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="h-px bg-neutral-100 mb-6 sm:mb-8" />
                    <p className="text-lg sm:text-xl font-bold text-neutral-800 mb-6 sm:mb-8 leading-relaxed">{q.question_text}</p>

                    <div className="space-y-3">
                      {optionsArr.map((optText, idx) => {
                        const l = OPTION_LETTERS[idx];
                        if (!l) return null;
                        const isThisCorrect = l === correctAnswerKey;
                        const isThisUserSelection = selectedOption === l;

                        let containerStyle = "border-neutral-100 bg-neutral-100 text-neutral-400";
                        if (isThisCorrect) {
                          containerStyle = "border-brand-green bg-green-50 ring-1 ring-brand-green text-green-700";
                        } else if (isThisUserSelection && !isCorrect) {
                          containerStyle = "border-brand-coral bg-red-50 ring-1 ring-brand-coral text-red-700";
                        }

                        return (
                          <div key={l} className={`p-4 sm:p-5 rounded-xl border-2 flex items-center gap-4 sm:gap-5 transition-all ${containerStyle}`}>
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 ${
                              isThisCorrect ? 'bg-brand-green text-white' :
                              (isThisUserSelection && !isCorrect) ? 'bg-brand-coral text-white' :
                              'bg-white border border-neutral-200 text-neutral-400'
                            }`}>
                              {l.toUpperCase()}
                            </span>
                            <span className="font-bold text-base sm:text-lg">{optText}</span>
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className={`mt-6 sm:mt-8 p-5 sm:p-6 rounded-xl border-l-4 ${isCorrect ? 'bg-green-50 border-brand-green' : 'bg-blue-50 border-brand-blue'}`}>
                        <p className="font-black uppercase text-xs mb-2 text-neutral-600 tracking-widest">Explanation</p>
                        <p className="text-neutral-700 text-sm leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}