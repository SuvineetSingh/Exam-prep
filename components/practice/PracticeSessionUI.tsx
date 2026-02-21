'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface PracticeSessionUIProps {
  question: any;
  selectedOption: string | null;
  setSelectedOption: (key: string) => void;
  isSubmitted: boolean;
  setIsSubmitted: (val: boolean) => void;
  isFirst: boolean;
  isLast: boolean;
  navigate: (dir: 'prev' | 'next') => void;
}

export function PracticeSessionUI({
  question,
  selectedOption,
  setSelectedOption,
  isSubmitted,
  setIsSubmitted,
  isFirst,
  isLast,
  navigate
}: PracticeSessionUIProps) {
  const router = useRouter();
  const [showExitPopup, setShowExitPopup] = useState(false);

  const rawCorrectValue = String(question.correct_answer || question.correct_option || "");
  const correctAnswerKey = rawCorrectValue.trim().toLowerCase();
  const isCorrect = selectedOption?.toLowerCase() === correctAnswerKey;

  const options = [
    { key: 'a', text: question.option_a },
    { key: 'b', text: question.option_b },
    { key: 'c', text: question.option_c },
    { key: 'd', text: question.option_d },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 relative">
      {/* --- EXIT CONFIRMATION MODAL --- */}
      {showExitPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl scale-in-center animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Exit Practice?</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">Your current progress in this session will not be saved. Do you really want to leave?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowExitPopup(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Stay
              </button>
              <button 
                onClick={() => router.push('/practice')}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-colors"
              >
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Navigation / Header */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => setShowExitPopup(true)}
            className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider"
          >
            ← EXIT PRACTICE
          </button>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
              {question.exam_type}
            </span>
            <span className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-bold text-blue-600 shadow-sm uppercase">
              {question.category || 'General'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm ${
              question.difficulty === 'hard' ? 'bg-red-100 text-red-600' : 
              question.difficulty === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              {question.difficulty || 'Easy'}
            </span>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-8 leading-relaxed">
            {question.question_text}
          </h2>

          <div className="space-y-3">
            {options.map((opt) => {
              let containerStyle = "border-slate-200 hover:border-blue-300";
              if (isSubmitted) {
                if (opt.key === correctAnswerKey) containerStyle = "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500";
                else if (selectedOption === opt.key) containerStyle = "border-red-500 bg-red-50 ring-1 ring-red-500";
                else containerStyle = "opacity-50 border-slate-100";
              } else if (selectedOption === opt.key) {
                containerStyle = "border-blue-600 bg-blue-50 ring-1 ring-blue-600";
              }

              return (
                <button
                  key={opt.key}
                  disabled={isSubmitted}
                  onClick={() => setSelectedOption(opt.key)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${containerStyle}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
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
              onClick={() => setIsSubmitted(true)}
              disabled={!selectedOption}
              className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-600 disabled:opacity-30 transition-all active:scale-[0.98]"
            >
              Check Answer
            </button>
          ) : (
            <div className={`mt-8 p-6 rounded-2xl border-l-4 animate-in fade-in slide-in-from-top-2 duration-300 ${isCorrect ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-500'}`}>
              <p className="font-black uppercase text-sm mb-2">{isCorrect ? '✓ Correct Answer' : '✕ Incorrect'}</p>
              <p className="text-slate-700 text-sm"><span className="font-bold">Explanation:</span> {question.explanation}</p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex justify-between gap-4">
          <button 
            onClick={() => navigate('prev')}
            disabled={isFirst}
            className="flex-1 py-3 px-6 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-25"
          >
            ← Previous
          </button>
          <button 
            onClick={() => navigate('next')}
            disabled={isLast}
            className="flex-1 py-3 px-6 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-25"
          >
            Next Question →
          </button>
        </div>
      </div>
    </div>
  );
}