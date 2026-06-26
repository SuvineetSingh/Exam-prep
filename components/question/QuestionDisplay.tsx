"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { saveUserAnswer } from "@/lib/supabase/queries/userStats";

interface QuestionDisplayProps {
  question: {
    id: number;
    exam_type: string;
    category: string;
    difficulty: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string; // 'A', 'B', 'C', or 'D'
    explanation: string;
  };
  mode: "practice" | "timed";
  onAnswer?: (selected: string, isCorrect: boolean) => void;
  questionNumber?: number;
  totalQuestions?: number;
}

export function QuestionDisplay({ question: q, mode, onAnswer, questionNumber, totalQuestions }: QuestionDisplayProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const options = [
    { label: "A", text: q.option_a },
    { label: "B", text: q.option_b },
    { label: "C", text: q.option_c },
    { label: "D", text: q.option_d },
  ];

  const handleSelect = (label: string) => {
    if (isSubmitted && mode === "practice") return;
    setSelectedOption(label);
    
    // In Timed mode, we might notify the parent component immediately
    if (mode === "timed" && onAnswer) {
      onAnswer(label, label === q.correct_answer);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption) return;

    const isCorrect = selectedOption === q.correct_answer;
    setIsSubmitted(true);

    // Save the answer to database for stats tracking
    await saveUserAnswer(q.id, selectedOption, isCorrect, 0, mode, null, q.exam_type);

    // Notify parent component if callback provided
    if (onAnswer) {
      onAnswer(selectedOption, isCorrect);
    }
  };

  const isCorrect = selectedOption === q.correct_answer;

  return (
    <div className="card p-5 sm:p-8 max-w-3xl mx-auto">
      {/* Header Info */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {questionNumber != null && (
          <span className="px-2.5 py-1 bg-neutral-100 text-neutral-500 text-[10px] font-black uppercase rounded-md">
            {totalQuestions != null ? `Question ${questionNumber} of ${totalQuestions}` : `Question ${questionNumber}`}
          </span>
        )}
        <span className="px-2.5 py-1 bg-brand-green text-white text-[10px] font-black uppercase rounded-md shadow-sm">
          {q.exam_type}
        </span>
        <span className="px-2.5 py-1 bg-neutral-100 text-neutral-500 text-[10px] font-bold uppercase rounded-md">
          {q.category}
        </span>
        <span className={`ml-auto text-[10px] font-black uppercase px-2 py-1 rounded ${
          q.difficulty === 'hard' ? 'text-brand-coral bg-red-50' :
          q.difficulty === 'medium' ? 'text-amber-600 bg-amber-50' : 'text-green-600 bg-green-50'
        }`}>
          {q.difficulty}
        </span>
      </div>

      {/* Question Text */}
      <h2 className="text-neutral-900 text-lg sm:text-xl font-bold leading-tight mb-8">
        {q.question_text}
      </h2>

      {/* Options List */}
      <div className="space-y-3 mb-8">
        {options.map((opt) => {
          let variant = "default";
          if (isSubmitted && mode === "practice") {
            if (opt.label === q.correct_answer) variant = "correct";
            else if (opt.label === selectedOption) variant = "wrong";
          } else if (selectedOption === opt.label) {
            variant = "selected";
          }

          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              disabled={isSubmitted && mode === "practice"}
              className={`answer-option items-start gap-4 ${
                variant === "correct" ? "answer-option-correct" :
                variant === "wrong" ? "answer-option-wrong" :
                variant === "selected" ? "answer-option-selected" : ""
              }`}
            >
              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${
                variant === "correct" ? "bg-brand-green border-brand-green text-white" :
                variant === "wrong" ? "bg-brand-coral border-brand-coral text-white" :
                variant === "selected" ? "bg-brand-green border-brand-green text-white" :
                "bg-neutral-100 border-neutral-200 text-neutral-500"
              }`}>
                {opt.label}
              </span>
              <span className="text-base sm:text-lg font-medium pt-0.5">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Practice Mode Actions & Feedback */}
      {mode === "practice" && (
        <div className="space-y-6">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className="btn-primary w-full py-4 text-lg disabled:bg-neutral-300"
            >
              Check Answer
            </button>
          ) : (
            <div className={`p-5 sm:p-6 rounded-2xl border ${isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-3 mb-3">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="text-brand-green" size={24} />
                    <span className="text-green-800 font-black uppercase text-sm">Correct! Excellent Work</span>
                  </>
                ) : (
                  <>
                    <XCircle className="text-brand-coral" size={24} />
                    <span className="text-red-800 font-black uppercase text-sm">Incorrect Answer</span>
                  </>
                )}
              </div>
              <div className="text-neutral-700 leading-relaxed">
                <p className="font-bold text-neutral-900 mb-1">Explanation:</p>
                {q.explanation}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timed Mode Note */}
      {mode === "timed" && (
        <div className="flex items-center justify-center gap-2 text-neutral-400 italic text-sm py-4 border-t border-neutral-100">
          <AlertCircle size={16} />
          Your progress is being saved. You can review all explanations at the end.
        </div>
      )}
    </div>
  );
}