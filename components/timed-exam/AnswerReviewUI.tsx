'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface AnswerReviewUIProps {
  questions: any[];
  summary: any;
}

export function AnswerReviewUI({ questions, summary }: AnswerReviewUIProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* --- HEADER SUMMARY BOX --- */}
        <div className="bg-white rounded-[3rem] p-10 mb-8 shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-8">
             <div>
                <div className="mb-2 inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {summary?.exam_type || 'Session'} Review
                </div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Answer  Review</h1>
                <p className="text-slate-400 font-bold text-sm">{summary?.dateFormatted}</p>
             </div>
             <Link href="/questions" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">← Exit Review</Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-indigo-200 p-6 rounded-[2rem] text-white">
              <p className="text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Score</p>
              <p className="text-3xl font-black text-indigo-700">{summary?.score ?? 0} <span className="text-slate-900 text-lg">/ {summary?.total_questions ?? 0}</span></p>
            </div>
            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest">Answered</p>
              <p className="text-3xl font-black text-emerald-700">{summary?.answered_count ?? 0}</p>
            </div>
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
              <p className="text-[10px] font-black text-amber-600 uppercase mb-1 tracking-widest">Unanswered</p>
              <p className="text-3xl font-black text-amber-700">{summary?.unanswered_count ?? 0}</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
              <p className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">Time Taken</p>
              <p className="text-xl font-black text-blue-800 leading-tight">{summary?.timeFormatted}</p>
            </div>
          </div>
        </div>

        {/* --- QUESTIONS LIST --- */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            // LOGIC FROM PRACTICE MODE
            const rawCorrectValue = String(q.correct_answer || q.correct_option || "");
            const correctAnswerKey = rawCorrectValue.trim().toLowerCase();
            const selectedOption = (q.userAnswer || "").trim().toLowerCase();
            
            const isCorrect = selectedOption === correctAnswerKey;
            const isUnattempted = selectedOption === 'unattempted' || selectedOption === '';
            
            // Show explanation if not correct
            const isExpanded = expandedId === q.id || !isCorrect;

            return (
              <div key={q.id || idx} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm transition-all">
                <button
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  className="w-full p-8 flex justify-between items-center text-left hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg
                      ${isCorrect ? 'bg-emerald-100 text-emerald-600' : isUnattempted ? 'bg-slate-100 text-slate-400' : 'bg-rose-100 text-rose-600'}`}>
                      {isCorrect ? '✓' : isUnattempted ? '?' : '✕'}
                    </div>
                    <div>
                        <span className="block font-black text-slate-900 text-xl tracking-tight">Question {idx + 1}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isCorrect ? 'text-emerald-500' : isUnattempted ? 'text-slate-400' : 'text-rose-500'}`}>
                          {isCorrect ? 'Correct' : isUnattempted ? 'Unanswered' : 'Incorrect'}
                        </span>
                    </div>
                  </div>
                  <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-slate-300"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="px-10 pb-10 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="h-px bg-slate-100 mb-8" />
                    <p className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">{q.question_text}</p>
                    
                    <div className="space-y-3">
                      {['a', 'b', 'c', 'd'].map((l) => {
                        const optionKey = l.toLowerCase();
                        const isThisCorrect = optionKey === correctAnswerKey;
                        const isThisUserSelection = selectedOption === optionKey;
                        
                        let containerStyle = "border-slate-100 bg-slate-50 text-slate-400";
                        if (isThisCorrect) {
                          containerStyle = "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 text-emerald-700";
                        } else if (isThisUserSelection && !isCorrect) {
                          containerStyle = "border-rose-500 bg-rose-50 ring-1 ring-rose-500 text-rose-700";
                        }

                        return (
                          <div key={l} className={`p-5 rounded-2xl border-2 flex items-center gap-5 transition-all ${containerStyle}`}>
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                              isThisCorrect ? 'bg-emerald-500 text-white' : 
                              (isThisUserSelection && !isCorrect) ? 'bg-rose-500 text-white' : 
                              'bg-white border border-slate-200 text-slate-400'
                            }`}>
                              {l.toUpperCase()}
                            </span>
                            <span className="font-bold text-lg">{q[`option_${l}`]}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* EXPLANATION BOX - Logic from PracticeSessionUI */}
                    {q.explanation && (
                      <div className={`mt-8 p-6 rounded-2xl border-l-4 ${isCorrect ? 'bg-emerald-50 border-emerald-500' : 'bg-blue-50 border-blue-500'}`}>
                        <p className="font-black uppercase text-xs mb-2 text-slate-600 tracking-widest">
                          {isCorrect ? 'Explanation' : 'Explanation'}
                        </p>
                        <p className="text-slate-700 text-sm leading-relaxed">
                          {q.explanation}
                        </p>
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