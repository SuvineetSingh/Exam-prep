import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getDifficultyStyle, getExamTypeBadgeClass } from "@/lib/utils/questionHelpers";

interface QuestionCardProps {
  question: {
    id: number;
    exam_type: string;
    category: string;
    difficulty: string;
    question_text: string;
    is_attempted?: boolean;
  };
  questionNumber?: number;
}

export function QuestionCard({ question: q, questionNumber }: QuestionCardProps) {
  const diffStyle    = getDifficultyStyle(q.difficulty);
  const examBadgeCls = getExamTypeBadgeClass(q.exam_type);

  return (
    <Link href={`/questions/${q.id}`} target="_blank" className="block">
      <div className="card-hover p-5 sm:p-6 hover:border-brand-green group relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {questionNumber != null && (
            <span className="px-2.5 py-1 bg-neutral-100 text-neutral-500 text-[10px] font-black uppercase rounded-md">
              Q{questionNumber}
            </span>
          )}
          <span className={examBadgeCls}>{q.exam_type}</span>
          <span className="px-2.5 py-1 bg-neutral-100 text-neutral-500 text-[10px] font-bold uppercase rounded-md">
            {q.category}
          </span>
          <span className={`ml-auto text-[10px] font-black uppercase px-2 py-1 rounded ${diffStyle.className}`}>
            {diffStyle.label}
          </span>
        </div>

        <div className="flex items-start gap-2">
          {q.is_attempted && (
            <CheckCircle2 size={20} className="text-brand-green flex-shrink-0 mt-0.5" />
          )}
          <p className="text-neutral-800 text-base sm:text-lg font-semibold leading-snug group-hover:text-neutral-900 transition-colors">
            {q.question_text}
          </p>
        </div>
      </div>
    </Link>
  );
}