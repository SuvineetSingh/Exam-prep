import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CoursesClient } from '@/components/subscription/CoursesClient';

const COURSES = [
  {
    exam_type: 'CPA',
    name: 'CPA — Certified Public Accountant',
    description: 'Financial accounting, auditing, regulation, and business environments & concepts.',
    icon: '📊',
    color: 'blue',
  },
  {
    exam_type: 'CFA',
    name: 'CFA — Chartered Financial Analyst',
    description: 'Portfolio management, equity analysis, fixed income, derivatives, and ethics.',
    icon: '📈',
    color: 'indigo',
  },
  {
    exam_type: 'FE',
    name: 'FE — Fundamentals of Engineering',
    description: 'Mathematics, engineering sciences, and discipline-specific technical topics.',
    icon: '⚙️',
    color: 'emerald',
  },
];

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; session_id?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch premium status and question counts in parallel
  const [profileResult, ...countResults] = await Promise.all([
    supabase.from('user_profiles').select('is_premium').eq('id', user.id).single(),
    ...COURSES.map((c) =>
      supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('exam_type', c.exam_type)
    ),
  ]);

  const isPremium = profileResult.data?.is_premium ?? false;
  const questionCounts: number[] = countResults.map((r) => r.count ?? 0);

  const params = await searchParams;
  const successPending = params.success === 'true';
  const sessionId = params.session_id;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user as any} />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 pt-24 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Courses</h1>
          <p className="text-gray-600">
            {isPremium
              ? 'You have full access to all courses.'
              : 'Get unlimited access to all courses for a one-time payment of $50.'}
          </p>
        </div>

        <CoursesClient
          courses={COURSES.map((c, i) => ({ ...c, questionCount: questionCounts[i] ?? 0 }))}
          isPremium={isPremium}
          successPending={successPending}
          sessionId={sessionId}
        />
      </main>
      <Footer />
    </div>
  );
}
