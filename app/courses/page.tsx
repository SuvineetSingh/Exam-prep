import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { CoursesClient } from '@/components/subscription/CoursesClient';
import { COURSE_CATALOG } from '@/lib/utils/constants';
import type { CourseName, UserStats } from '@/lib/types';

const COURSES = COURSE_CATALOG;

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; session_id?: string; courses?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch course subscriptions, question counts, and user stats in parallel
  const [subsResult, answersResult, ...countResults] = await Promise.all([
    supabase
      .from('course_subscriptions')
      .select('course')
      .eq('user_id', user.id),
    supabase
      .from('user_answers')
      .select('is_correct, mode, created_at')
      .eq('user_id', user.id),
    ...COURSES.map((c) =>
      supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('exam_type', c.exam_type)
    ),
  ]);

  const purchasedCourses: CourseName[] = (subsResult.data ?? []).map(
    (row) => row.course as CourseName
  );
  const questionCounts: number[] = countResults.map((r) => r.count ?? 0);

  // Compute stats server-side
  const answers = answersResult.data ?? [];
  const totalAnswered = answers.length;
  const correctCount = answers.filter((a) => a.is_correct).length;
  const accuracyRate = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = answers.filter((a) => a.created_at.startsWith(todayStr)).length;
  const uniqueDays = new Set(answers.map((a) => a.created_at.slice(0, 10)));
  const MS = 86400000;
  let cursor = new Date(todayStr + 'T00:00:00Z');
  if (!uniqueDays.has(todayStr)) cursor = new Date(cursor.getTime() - MS);
  let streak = 0;
  while (uniqueDays.has(cursor.toISOString().slice(0, 10))) { streak++; cursor = new Date(cursor.getTime() - MS); }
  const stats: UserStats = {
    total_answered: totalAnswered,
    practice_answered: answers.filter((a) => a.mode === 'practice').length,
    timed_answered: answers.filter((a) => a.mode === 'timed').length,
    accuracy_rate: accuracyRate,
    study_streak: streak,
    today_count: todayCount,
    this_week_improvement: 0,
  };

  const params = await searchParams;
  const successPending = params.success === 'true';
  const sessionId = params.session_id;
  const successCourses = params.courses?.split(',').filter(Boolean);

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.username ||
    user.email?.split('@')[0] ||
    'there';

  const hasAnyCourse = purchasedCourses.length > 0;

  return (
    <AppShell user={user}>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-1">
          Courses
        </h1>
        <p className="text-neutral-500 text-sm">
          {hasAnyCourse
            ? `You have Pro access to ${purchasedCourses.join(', ')}.`
            : 'Get unlimited access — CMA $59, CFA $49, FE $49. 15 free questions to start.'}
        </p>
      </div>

      <CoursesClient
        courses={COURSES.map((c, i) => ({ ...c, questionCount: questionCounts[i] ?? 0 }))}
        purchasedCourses={purchasedCourses}
        displayName={displayName}
        stats={stats}
        successPending={successPending}
        sessionId={sessionId}
        successCourses={successCourses}
      />
    </AppShell>
  );
}
