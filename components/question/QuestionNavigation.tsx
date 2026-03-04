'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface QuestionNavigationProps {
  prevId: number | null;
  nextId: number | null;
}

export function QuestionNavigation({ prevId, nextId }: QuestionNavigationProps) {
  return (
    <div className="flex items-center justify-between mt-6 gap-4">
      {prevId ? (
        <Link
          href={`/questions/${prevId}`}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
        >
          <ChevronLeft size={20} />
          <span>Previous Question</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {nextId && (
        <Link
          href={`/questions/${nextId}`}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md ml-auto"
        >
          <span>Next Question</span>
          <ChevronRight size={20} />
        </Link>
      )}
    </div>
  );
}
