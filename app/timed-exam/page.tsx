'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ExamSetupForm } from '@/components/timed-exam/ExamSetupForm';

export default function ExamSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [config, setConfig] = useState({
    examType: '',
    questionCount: 20,
  });
  const [loading, setLoading] = useState(false);
  const [fetchingFilters, setFetchingFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Logic: Fetch dynamic exam types
  const fetchExamTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('questions').select('exam_type');
      if (error) throw error;
      if (data) {
        const uniqueExams = Array.from(new Set(data.map((item) => item.exam_type))).sort();
        setExamTypes(uniqueExams as string[]);
      }
    } catch (err: any) {
      console.error('Error fetching exam types:', err.message);
    } finally {
      setFetchingFilters(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchExamTypes();
  }, [fetchExamTypes]);

  const timeLimit = config.questionCount * 1.5;

  const handleStartExam = () => {
    if (!config.examType || config.examType === '') {
      setError('Please select an exam type to continue.');
      return;
    }
    setError(null);
    setLoading(true);

    const sessionId = crypto.randomUUID();
    router.push(
      `/timed-exam/${sessionId}?type=${config.examType}&count=${config.questionCount}`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative">
      {/* Back Button */}
      <div className="absolute top-8 left-8">
        <Link
          href="/questions"
          className="inline-flex items-center gap-3 text-gray-400 hover:text-blue-600 transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-white shadow-sm border border-gray-100 group-hover:border-blue-200 group-hover:shadow-md transition-all">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Back</span>
        </Link>
      </div>

      <ExamSetupForm
        examTypes={examTypes}
        config={config}
        setConfig={(newConfig) => {
          setConfig(newConfig);
          setError(null);
        }}
        loading={loading}
        fetchingFilters={fetchingFilters}
        error={error}
        onStart={handleStartExam}
        timeLimit={timeLimit}
      />
    </div>
  );
}