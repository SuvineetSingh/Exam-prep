'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface PracticeQuestion {
  id: number;
  exam_type: string;
  category: string;
  difficulty: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  correct_option: string;
  explanation: string;
}

interface PracticeQuestionProps {
  id: string | string[];
}

export function PracticeQuestion({ id }: PracticeQuestionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const exam = searchParams.get('exam') || 'all';
  const cat = searchParams.get('cat') || 'all';

  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFirst, setIsFirst] = useState(false);
  const [isLast, setIsLast] = useState(false);
  const [navIds, setNavIds] = useState<{ prev: number | null; next: number | null }>({ prev: null, next: null });

  useEffect(() => {
    async function fetchQuestion() {
      setLoading(true);
      const currentId = Number(id);
      const supabase = createClient();

      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('id', currentId)
        .single();

      if (data) {
        setQuestion(data);
        setIsSubmitted(false);
        setSelectedOption(null);

        let prevQuery = supabase.from('questions').select('id').lt('id', currentId).order('id', { ascending: false });
        let nextQuery = supabase.from('questions').select('id').gt('id', currentId).order('id', { ascending: true });

        if (exam !== 'all') { prevQuery = prevQuery.eq('exam_type', exam); nextQuery = nextQuery.eq('exam_type', exam); }
        if (cat !== 'all') { prevQuery = prevQuery.eq('category', cat); nextQuery = nextQuery.eq('category', cat); }

        const [{ data: prevData }, { data: nextData }] = await Promise.all([
          prevQuery.limit(1).maybeSingle(),
          nextQuery.limit(1).maybeSingle(),
        ]);

        setIsFirst(!prevData);
        setIsLast(!nextData);
        setNavIds({ prev: prevData ? prevData.id : null, next: nextData ? nextData.id : null });
      }
      setLoading(false);
    }
    fetchQuestion();
  }, [id, exam, cat]);

  const navigate = (direction: 'prev' | 'next') => {
    const targetId = direction === 'prev' ? navIds.prev : navIds.next;
    if (targetId) router.push(`/practice/${targetId}?exam=${exam}&cat=${cat}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">
        Loading Question...
      </div>
    );
  }

  if (!question) {
    return <div className="p-10 text-center text-gray-500">Question not found.</div>;
  }

  const correctAnswerKey = String(question.correct_answer || question.correct_option || '').trim().toLowerCase();
  const isCorrect = selectedOption?.toLowerCase() === correctAnswerKey;

  const options = [
    { key: 'a', text: question.option_a },
    { key: 'b', text: question.option_b },
    { key: 'c', text: question.option_c },
    { key: 'd', text: question.option_d },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/practice" className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors">
            ← EXIT PRACTICE
          </Link>
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

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-8 leading-relaxed">
            {question.question_text}
          </h2>

          <div className="space-y-3">
            {options.map((opt) => {
              let style = 'border-slate-200 hover:border-blue-300';
              if (isSubmitted) {
                if (opt.key === correctAnswerKey) style = 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500';
                else if (selectedOption === opt.key) style = 'border-red-500 bg-red-50 ring-1 ring-red-500';
                else style = 'opacity-50 border-slate-100';
              } else if (selectedOption === opt.key) {
                style = 'border-blue-600 bg-blue-50 ring-1 ring-blue-600';
              }

              return (
                <button
                  key={opt.key}
                  disabled={isSubmitted}
                  onClick={() => setSelectedOption(opt.key)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${style}`}
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
            <div className={`mt-8 p-6 rounded-2xl border-l-4 ${isCorrect ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-500'}`}>
              <p className="font-black uppercase text-sm mb-2">{isCorrect ? '✓ Correct Answer' : '✕ Incorrect'}</p>
              <p className="text-slate-700 text-sm">
                <span className="font-bold">Explanation:</span> {question.explanation}
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-between gap-4">
          <button
            onClick={() => navigate('prev')}
            disabled={isFirst}
            className="flex-1 py-3 px-6 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <button
            onClick={() => navigate('next')}
            disabled={isLast}
            className="flex-1 py-3 px-6 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
          >
            Next Question →
          </button>
        </div>
      </div>
    </div>
  );
}
