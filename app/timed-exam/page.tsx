'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ExamSetupForm } from '@/components/timed-exam/ExamSetupForm';
import { PaywallBanner, RunningLowBanner, FREE_QUESTION_LIMIT, FREE_QUESTION_WARNING } from '@/components/subscription/PaywallBanner';
import { v4 as uuidv4 } from 'uuid';

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

  const [purchasedCourses, setPurchasedCourses] = useState<string[]>([]);
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [usedCount, setUsedCount] = useState(0);

  const fetchExamTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('questions').select('exam_type');
      if (error) throw error;
      if (data) {
        const uniqueExams = Array.from(new Set(data.map((item) => item.exam_type))).sort();
        setExamTypes(uniqueExams as string[]);
      }
    } catch (err) {
      console.error('Error fetching exam types:', err instanceof Error ? err.message : err);
    } finally {
      setFetchingFilters(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchExamTypes();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('course_subscriptions')
        .select('course')
        .eq('user_id', user.id)
        .then(({ data }) => {
          setPurchasedCourses((data ?? []).map((r: any) => r.course));
          setCoursesLoaded(true);
        });
    });
  }, [fetchExamTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const examType = config.examType;
    const hasCourse = purchasedCourses.includes(examType);
    if (!examType || hasCourse || !coursesLoaded) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('user_answers')
        .select('question_id')
        .eq('user_id', user.id)
        .eq('exam_type', examType)
        .then(({ data }) => {
          const distinct = data ? new Set(data.map((r) => r.question_id)).size : 0;
          setUsedCount(distinct);
        });
    });
  }, [config.examType, purchasedCourses, coursesLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const timeLimit = config.questionCount * 1.5;

  const handleStartExam = () => {
    if (!config.examType || config.examType === '') {
      setError('Please select an exam type to continue.');
      return;
    }
    setError(null);
    setLoading(true);

    const sessionId = uuidv4();
    
    router.push(
      `/timed-exam/${sessionId}?type=${config.examType}&count=${config.questionCount}`
    );
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-4 sm:p-6 relative">
      <div className="absolute top-8 left-8">
        <Link
          href="/questions"
          className="inline-flex items-center gap-3 text-neutral-400 hover:text-brand-green transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-white shadow-sm border border-neutral-200 group-hover:border-green-200 group-hover:shadow-card transition-all">
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

      {coursesLoaded && !purchasedCourses.includes(config.examType) && config.examType && usedCount >= FREE_QUESTION_LIMIT ? (
        <div className="max-w-md w-full">
          <PaywallBanner examType={config.examType} usedCount={usedCount} />
        </div>
      ) : (
        <>
          {coursesLoaded && !purchasedCourses.includes(config.examType) && config.examType && usedCount >= FREE_QUESTION_WARNING && (
            <div className="max-w-md w-full mb-4">
              <RunningLowBanner
                examType={config.examType}
                remaining={FREE_QUESTION_LIMIT - usedCount}
              />
            </div>
          )}
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
        </>
      )}
    </div>
  );
}