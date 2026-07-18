'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { QuestionView } from '@/components/question/QuestionView';
import { saveUserAnswer } from '@/lib/supabase/queries/userStats';
import { getCorrectKey } from '@/lib/utils/questionHelpers';
import { isQuestionStarred, toggleStar } from '@/lib/supabase/queries/starredQueries';
import type { Question } from '@/lib/types';

interface QuestionViewClientProps {
  question: Question;
  prevId: number | null;
  nextId: number | null;
  questionNumber?: number;
  totalQuestions?: number;
}

export function QuestionViewClient({
  question,
  prevId,
  nextId,
  questionNumber,
  totalQuestions,
}: QuestionViewClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted]       = useState(false);
  const [starred, setStarred]               = useState(false);
  const [userId, setUserId]                 = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        isQuestionStarred(user.id, Number(question.id)).then(setStarred);
      }
    });
  }, [question.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleStar = async () => {
    if (!userId) return;
    const next = !starred;
    setStarred(next);
    try {
      await toggleStar(userId, Number(question.id), question.exam_type, !next);
    } catch {
      setStarred(!next);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption || isSubmitted) return;
    setIsSubmitted(true);
    const isCorrect = selectedOption === getCorrectKey(question);
    await saveUserAnswer(
      Number(question.id),
      selectedOption.toUpperCase(),
      isCorrect,
      0,
      'practice',
      null,
      question.exam_type,
    );
  };

  const handleNav = (id: number | null) => {
    if (id == null) return;
    setSelectedOption(null);
    setIsSubmitted(false);
    router.push(`/questions/${id}`);
  };

  const backButton = (
    <Link
      href="/questions"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-white/80 border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-white hover:border-neutral-300 transition-all"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Questions
    </Link>
  );

  return (
    <QuestionView
      question={question}
      showSubmitButton={true}
      showExplanation={true}
      lockAfterSubmit={true}
      fireSelectImmediately={false}
      selectedOption={selectedOption}
      onOptionSelect={setSelectedOption}
      isSubmitted={isSubmitted}
      onSubmit={handleSubmit}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      onPrev={() => handleNav(prevId)}
      onNext={() => handleNav(nextId)}
      isFirst={prevId == null}
      isLast={nextId == null}
      isStarred={starred}
      onToggleStar={handleToggleStar}
      headerExtra={backButton}
      contained
    />
  );
}
