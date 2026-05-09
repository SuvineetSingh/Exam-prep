import Link from 'next/link';
import { APP_CONFIG } from '@/lib/utils/constants';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/server';

const COURSES = [
  {
    exam_type: 'CPA',
    name: 'CPA — Certified Public Accountant',
    description: 'Financial accounting, auditing, regulation, and business environments & concepts.',
    icon: '📊',
    tag: 'Most Popular',
  },
  {
    exam_type: 'CFA',
    name: 'CFA — Chartered Financial Analyst',
    description: 'Portfolio management, equity analysis, fixed income, derivatives, and ethics.',
    icon: '📈',
    tag: null,
  },
  {
    exam_type: 'FE',
    name: 'FE — Fundamentals of Engineering',
    description: 'Mathematics, engineering sciences, and discipline-specific technical topics.',
    icon: '⚙️',
    tag: null,
  },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: 'Practice Mode',
    body: 'Work through questions at your own pace. Get instant feedback and full explanations after each answer.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Timed Exams',
    body: 'Simulate real exam conditions with full-length timed sessions and a detailed performance summary when you finish.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Exam History',
    body: 'Every session is logged. Review your scores, time taken, and exactly which questions tripped you up.',
  },
];

const STEPS = [
  { number: '01', title: 'Create a free account', body: 'Sign up in under a minute — no credit card required.' },
  { number: '02', title: 'Pick your exam and start', body: 'Choose CPA, CFA, or FE and dive into 20 free questions per course.' },
  { number: '03', title: 'Upgrade when you\'re ready', body: 'Unlock unlimited questions for any course with a one-time $50 payment.' },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const questionCounts: number[] = user
    ? []
    : await Promise.all(
        COURSES.map(async (c) => {
          const { count } = await supabase
            .from('questions')
            .select('id', { count: 'exact', head: true })
            .eq('exam_type', c.exam_type);
          return count ?? 0;
        })
      );

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header user={user as any} />
        <main className="flex-1 flex items-center justify-center pt-16">
          <div className="text-center px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">You're logged in</h1>
            <p className="text-gray-500 mb-8">Head to your courses to continue studying.</p>
            <Link
              href="/courses"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-colors"
            >
              Go to My Courses →
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-blue-600 tracking-tight">
            {APP_CONFIG.NAME}
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Log in
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Sign up free
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-white py-24 sm:py-32">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#0070f3] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
          </div>
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-8 tracking-wider uppercase">
              CPA · CFA · FE
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
              Pass your professional exam.<br />First try.
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
              The most focused question bank built for serious candidates. Practice at your own pace or race the clock — thousands of exam-style questions, organized by course.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5"
              >
                Start Free — No Card Required
              </Link>
              <Link
                href="/courses"
                className="w-full sm:w-auto text-gray-600 hover:text-gray-900 font-semibold px-8 py-4 rounded-xl text-base transition-colors border border-gray-200 hover:border-gray-300"
              >
                Browse Courses →
              </Link>
            </div>
            <p className="mt-5 text-sm text-gray-400">20 free questions per course · No credit card · Cancel anytime</p>
          </div>
        </section>

        {/* ── What You Get ── */}
        <section className="bg-gray-50 py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to prepare</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Built for candidates who study on a schedule, not when inspiration strikes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-5">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Courses ── */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Three courses. One platform.</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Whether you're sitting the CPA, CFA, or FE exam, we have the questions you need.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {COURSES.map((course, i) => (
                <div key={course.exam_type} className="bg-gray-50 rounded-2xl border border-gray-200 p-8 relative overflow-hidden hover:shadow-md transition-shadow">
                  {course.tag && (
                    <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white px-2.5 py-1 rounded-full">
                      {course.tag}
                    </span>
                  )}
                  <div className="text-4xl mb-4">{course.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2 leading-tight">{course.name}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">{course.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      <strong className="text-gray-700">{questionCounts[i]?.toLocaleString() ?? '—'}</strong> questions
                    </span>
                    <span className="text-blue-600 font-bold">$50 Pro · 20 Free</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="bg-gray-50 py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Up and running in minutes</h2>
              <p className="text-gray-500">No setup. No fluff. Just questions.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white font-black text-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="bg-blue-600 py-20 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to start studying?</h2>
            <p className="text-blue-100 mb-8 leading-relaxed">
              Join candidates already using the platform to prepare for the CPA, CFA, and FE exams. Free to start — no card required.
            </p>
            <Link
              href="/register"
              className="inline-block bg-white text-blue-600 hover:bg-blue-50 font-bold px-10 py-4 rounded-xl text-base transition-colors shadow-xl"
            >
              Create Free Account →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
