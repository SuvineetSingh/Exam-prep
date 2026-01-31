'use client';

import { useRouter } from 'next/navigation';
import type { DashboardQuestion } from '@/lib/types';

interface QuestionRowProps {
  question: DashboardQuestion;
}

export function QuestionRow({ question }: QuestionRowProps) {
  const router = useRouter();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div
      onClick={() => router.push(`/questions/${question.id}`)}
      className="flex items-start p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors group"
    >
      {/* Status Indicator */}
      <div className="flex-shrink-0 mr-4 mt-1">
        {question.is_answered ? (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
        )}
      </div>

      {/* Question Content */}
      <div className="flex-1 min-w-0">
        {/* Topic Badge and Exam Type */}
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            {question.topic}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
            {question.exam_type}
          </span>
        </div>

        {/* Question Text */}
        <p className="text-sm text-gray-900 group-hover:text-primary-600 transition-colors">
          {truncateText(question.question_text)}
        </p>
      </div>

      {/* Difficulty Badge */}
      <div className="flex-shrink-0 ml-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(
            question.difficulty
          )}`}
        >
          {question.difficulty}
        </span>
      </div>
    </div>
  );
}

// Skeleton loader for loading state
export function QuestionRowSkeleton() {
  return (
    <div className="flex items-start p-4 border-b border-gray-200 animate-pulse">
      <div className="flex-shrink-0 mr-4 mt-1">
        <div className="w-6 h-6 rounded-full bg-gray-200"></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-5 w-32 bg-gray-200 rounded"></div>
          <div className="h-5 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );
}
