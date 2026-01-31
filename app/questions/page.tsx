'use client';

import { useState, useMemo } from 'react';
import { QuestionRow } from '@/components/question/QuestionRow';
import { Pagination } from '@/components/ui/Pagination';
import { Footer } from '@/components/layout/Footer';
import { dummyQuestions } from '@/lib/data/dummyQuestions';

const ITEMS_PER_PAGE = 5;

export default function QuestionsPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return dummyQuestions.slice(startIndex, endIndex);
  }, [currentPage]);

  const totalPages = Math.ceil(dummyQuestions.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Questions Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Practice questions for CPA, CFA, and FE exams
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            {paginatedQuestions.map((question) => (
              <QuestionRow key={question.id} question={question} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={dummyQuestions.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
