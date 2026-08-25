import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { CoursesClient } from '@/components/subscription/CoursesClient';
import { COURSE_CATALOG } from '@/lib/utils/constants';
import type { CourseName } from '@/lib/types';

const COURSES = COURSE_CATALOG;

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; session_id?: string; courses?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch course subscriptions and question counts in parallel
  const [subsResult, ...countResults] = await Promise.all([
    supabase
      .from('course_subscriptions')
      .select('course')
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
            : 'Try 15 questions free on any exam — then unlock unlimited practice with one simple, one-time payment.'}
        </p>
      </div>

      <CoursesClient
        courses={COURSES.map((c, i) => ({ ...c, questionCount: questionCounts[i] ?? 0 }))}
        purchasedCourses={purchasedCourses}
        displayName={displayName}
        successPending={successPending}
        sessionId={sessionId}
        successCourses={successCourses}
      />
    </AppShell>
  );
}
