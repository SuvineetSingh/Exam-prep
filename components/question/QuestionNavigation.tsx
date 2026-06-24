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
          className="btn-secondary px-6 py-3"
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
          className="btn-primary px-6 py-3 ml-auto"
        >
          <span>Next Question</span>
          <ChevronRight size={20} />
        </Link>
      )}
    </div>
  );
}
