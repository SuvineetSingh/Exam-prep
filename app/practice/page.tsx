'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { PracticeSetupForm } from '@/components/practice/PracticeSetupForm';
import { PaywallBanner, RunningLowBanner, FREE_QUESTION_LIMIT, FREE_QUESTION_WARNING } from '@/components/subscription/PaywallBanner';

export default function PracticeSetup() {
  const router = useRouter();
  const supabase = createClient();

  const [examTypes, setExamTypes] = useState<string[]>([]);

  const [examFilter, setExamFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [examError, setExamError] = useState(false);

  const [purchasedCourses, setPurchasedCourses] = useState<string[]>([]);
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [usedCount, setUsedCount] = useState(0);

  // Fetch all distinct exam types once on mount
  const fetchExamTypes = useCallback(async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('exam_type');

    if (error) {
      console.error('Error loading exam types:', error.message);
      return;
    }

    if (data) {
      const unique = Array.from(new Set(data.map((i) => i.exam_type).filter(Boolean))).sort();
      setExamTypes(unique as string[]);
    }
  }, [supabase]);

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

  // Check freemium quota when exam changes
  useEffect(() => {
    const hasCourse = purchasedCourses.includes(examFilter);
    if (!examFilter || examFilter === 'all' || hasCourse || !coursesLoaded) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('user_answers')
        .select('question_id')
        .eq('user_id', user.id)
        .eq('exam_type', examFilter)
        .then(({ data }) => {
          const distinct = data ? new Set(data.map((r) => r.question_id)).size : 0;
          setUsedCount(distinct);
        });
    });
  }, [examFilter, purchasedCourses, coursesLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExamChange = (val: string) => {
    setExamFilter(val);
    setExamError(false);
  };

  const handleStart = async () => {
    if (examFilter === 'all' || examFilter === '') {
      setExamError(true);
      return;
    }

    setLoading(true);
    const sessionId = uuidv4();

    const query = supabase.from('questions').select('id').eq('exam_type', examFilter).order('id', { ascending: true });

    const { data } = await query.limit(1).single();

    if (data) {
      router.push(
        `/practice/${data.id}?exam=${examFilter}&session=${sessionId}`
      );
    } else {
      setExamError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative">
      <div className="absolute top-8 left-8">
        <Link
          href="/questions"
          className="group flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-all font-bold text-sm"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
            ←
          </div>
          BACK
        </Link>
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Practice Mode</h1>
          <p className="text-gray-500 mt-2">Select your focus area to begin.</p>
        </div>

        {coursesLoaded && !purchasedCourses.includes(examFilter) && examFilter !== 'all' && usedCount >= FREE_QUESTION_LIMIT ? (
          <PaywallBanner examType={examFilter} usedCount={usedCount} />
        ) : (
          <>
            {coursesLoaded && !purchasedCourses.includes(examFilter) && examFilter !== 'all' && usedCount >= FREE_QUESTION_WARNING && (
              <div className="mb-4">
                <RunningLowBanner
                  examType={examFilter}
                  remaining={FREE_QUESTION_LIMIT - usedCount}
                />
              </div>
            )}
            <PracticeSetupForm
              examFilter={examFilter}
              setExamFilter={handleExamChange}
              options={{ examTypes }}
              onStart={handleStart}
              loading={loading}
              examError={examError}
            />
          </>
        )}
      </div>
    </div>
  );
}