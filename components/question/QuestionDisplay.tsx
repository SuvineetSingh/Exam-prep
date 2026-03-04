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
}

export function QuestionDisplay({ question: q, mode, onAnswer }: QuestionDisplayProps) {
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
    await saveUserAnswer(q.id, selectedOption, isCorrect, 0, mode);

    // Notify parent component if callback provided
    if (onAnswer) {
      onAnswer(selectedOption, isCorrect);
    }
  };

  const isCorrect = selectedOption === q.correct_answer;

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm transition-all max-w-3xl mx-auto">
      {/* Header Info */}
      <div className="flex items-center gap-2 mb-6">
        <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-md shadow-sm">
          {q.exam_type}
        </span>
        <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase rounded-md">
          {q.category}
        </span>
        <span className={`ml-auto text-[10px] font-black uppercase px-2 py-1 rounded ${
          q.difficulty === 'hard' ? 'text-red-600 bg-red-50' : 
          q.difficulty === 'medium' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
        }`}>
          {q.difficulty}
        </span>
      </div>

      {/* Question Text */}
      <h2 className="text-gray-900 text-xl font-bold leading-tight mb-8">
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
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                variant === "correct" ? "bg-emerald-50 border-emerald-500 text-emerald-900" :
                variant === "wrong" ? "bg-red-50 border-red-500 text-red-900" :
                variant === "selected" ? "bg-blue-50 border-blue-500 text-blue-900" :
                "bg-white border-gray-100 hover:border-blue-200 text-gray-700"
              }`}
            >
              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${
                variant === "correct" ? "bg-emerald-500 border-emerald-500 text-white" :
                variant === "wrong" ? "bg-red-500 border-red-500 text-white" :
                variant === "selected" ? "bg-blue-500 border-blue-500 text-white" :
                "bg-gray-50 border-gray-200 text-gray-500"
              }`}>
                {opt.label}
              </span>
              <span className="text-lg font-medium pt-0.5">{opt.text}</span>
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
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all"
            >
              Check Answer
            </button>
          ) : (
            <div className={`p-6 rounded-2xl border ${isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-3 mb-3">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="text-emerald-600" size={24} />
                    <span className="text-emerald-800 font-black uppercase text-sm">Correct! Excellent Work</span>
                  </>
                ) : (
                  <>
                    <XCircle className="text-red-600" size={24} />
                    <span className="text-red-800 font-black uppercase text-sm">Incorrect Answer</span>
                  </>
                )}
              </div>
              <div className="text-gray-700 leading-relaxed">
                <p className="font-bold text-gray-900 mb-1">Explanation:</p>
                {q.explanation}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timed Mode Note */}
      {mode === "timed" && (
        <div className="flex items-center justify-center gap-2 text-gray-400 italic text-sm py-4 border-t border-gray-50">
          <AlertCircle size={16} />
          Your progress is being saved. You can review all explanations at the end.
        </div>
      )}
    </div>
  );
}