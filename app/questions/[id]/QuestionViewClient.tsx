'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionView } from '@/components/question/QuestionView';
import { saveUserAnswer } from '@/lib/supabase/queries/userStats';
import { getCorrectKey } from '@/lib/utils/questionHelpers';
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
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted]       = useState(false);

  const handleSubmit = async () => {
    if (!selectedOption || isSubmitted) return;
    setIsSubmitted(true);
    const isCorrect = selectedOption === getCorrectKey(question);
    await saveUserAnswer(
      Number(question.id),
      selectedOption,
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
    />
  );
}
