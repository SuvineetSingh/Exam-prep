'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { PracticeSetupForm } from '@/components/practice/PracticeSetupForm';
import { PaywallBanner, RunningLowBanner, FREE_QUESTION_LIMIT, FREE_QUESTION_WARNING } from '@/components/subscription/PaywallBanner';
import { usePurchasedCourses } from '@/hooks/usePurchasedCourses';
import { fetchStarredIds } from '@/lib/supabase/queries/starredQueries';

export default function PracticeSetup() {
  const router = useRouter();
  const supabase = createClient();

  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const [examFilter, setExamFilter] = useState('all');
  const [starredMode, setStarredMode] = useState(false);
  const [starredCount, setStarredCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [examError, setExamError] = useState(false);
  const [usedCount, setUsedCount] = useState(0);

  const { purchasedCourses, coursesLoaded } = usePurchasedCourses(userId);

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
      if (user) {
        setUserId(user.id);
        fetchStarredIds(user.id).then((ids) => setStarredCount(ids.length));
      }
    });
  }, [fetchExamTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hasCourse = purchasedCourses.includes(examFilter);
    if (!examFilter || examFilter === 'all' || hasCourse || !coursesLoaded || !userId) return;

    supabase
      .from('user_answers')
      .select('question_id')
      .eq('user_id', userId)
      .eq('exam_type', examFilter)
      .then(({ data }) => {
        const distinct = data ? new Set(data.map((r) => r.question_id)).size : 0;
        setUsedCount(distinct);
      });
  }, [examFilter, purchasedCourses, coursesLoaded, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExamChange = (val: string) => {
    setExamFilter(val);
    setExamError(false);
  };

  const handleStart = async () => {
    if (!starredMode && (examFilter === 'all' || examFilter === '')) {
      setExamError(true);
      return;
    }

    setLoading(true);
    const sessionId = uuidv4();

    if (starredMode && userId) {
      const ids = await fetchStarredIds(userId);
      if (ids.length === 0) {
        setLoading(false);
        return;
      }
      // Store ordered starred IDs in sessionStorage so /practice/[id] can navigate within them
      try {
        sessionStorage.setItem(`starred_ids_${sessionId}`, JSON.stringify(ids.sort((a, b) => a - b)));
      } catch {}
      router.push(`/practice/${ids[0]}?session=${sessionId}&starred=true`);
      return;
    }

    const query = supabase.from('questions').select('id').eq('exam_type', examFilter).order('id', { ascending: true });

    const { data } = await query.limit(1).maybeSingle();

    if (data) {
      router.push(`/practice/${data.id}?exam=${examFilter}&session=${sessionId}`);
    } else {
      setExamError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6 relative">
      <div className="absolute top-6 left-6">
        <Link
          href="/questions"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-white border border-neutral-200 shadow-sm text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 hover:shadow transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </Link>
      </div>

      <div className="max-w-md w-full card p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-green-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6F56E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Practice Mode</h1>
          <p className="text-neutral-500 mt-2 text-sm">Select your focus area to begin.</p>
        </div>

        {/* Starred Questions mode toggle */}
        <div className="mb-6">
          <button
            onClick={() => { setStarredMode(v => !v); setExamError(false); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-card border-2 transition-all ${
              starredMode
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-neutral-200 bg-neutral-100 text-neutral-500 hover:border-amber-200 hover:bg-amber-50/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className={`w-5 h-5 ${starredMode ? 'text-amber-400' : 'text-neutral-300'}`} viewBox="0 0 24 24" fill={starredMode ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-bold">Practice Starred Questions</p>
                <p className="text-xs opacity-60">{starredCount} question{starredCount !== 1 ? 's' : ''} starred</p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${starredMode ? 'border-amber-500 bg-amber-500' : 'border-neutral-300'}`}>
              {starredMode && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
          </button>
          {starredMode && starredCount === 0 && (
            <p className="text-xs text-amber-600 text-center mt-2">Star questions during practice first — then come back here.</p>
          )}
        </div>

        {starredMode ? (
          <button
            onClick={handleStart}
            disabled={loading || starredCount === 0}
            className="w-full py-4 bg-brand-amber hover:bg-orange-500 disabled:opacity-40 text-white font-bold rounded-card transition-all"
          >
            {loading ? 'Starting…' : `Practice ${starredCount} Starred Question${starredCount !== 1 ? 's' : ''} →`}
          </button>
        ) : coursesLoaded && !purchasedCourses.includes(examFilter) && examFilter !== 'all' && usedCount >= FREE_QUESTION_LIMIT ? (
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