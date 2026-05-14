import Link from 'next/link';
import { redirect } from 'next/navigation';
import { APP_CONFIG } from '@/lib/utils/constants';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

const COURSES = [
  {
    exam_type: 'CMA',
    name: 'CMA — Certified Management Accountant',
    description: 'Financial planning, analysis, control, decision support, and professional ethics.',
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

const HOOKS = [
  {
    icon: '🌙',
    headline: 'Working late? Others are too.',
    body: 'Our after-work study rooms are full of professionals putting in the hours after a long day — just like you.',
  },
  {
    icon: '🌍',
    headline: 'Same goals, different time zones.',
    body: 'Connect with candidates from around the world who are sitting the same exam and feeling the same pressure.',
  },
  {
    icon: '🤝',
    headline: 'Stop grinding alone. Start growing together.',
    body: 'Share strategies, swap resources, and hold each other accountable — because the pass rate goes up when you have people in your corner.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Choose Your Path',
    body: 'Pick your exam — CPA, CFA, FE, or CMA — and tell us a little about your professional background.',
  },
  {
    number: '02',
    title: 'Find Your Study Partner',
    body: 'Jump into Chat Rooms built around your schedule, like "CMA After Work Hours" or "FE for Professionals."',
  },
  {
    number: '03',
    title: 'Practice with Purpose',
    body: 'Work through a targeted question bank — 15 free questions per course, unlimited with Pro access.',
  },
  {
    number: '04',
    title: 'Real-Time Support',
    body: 'Got a question at 11 PM? Post it in the Developer Feedback room or your course chat — someone\'s always around.',
  },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    label: 'Practice Mode',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Timed Exams',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    label: 'Exam History',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    label: 'Starred Questions',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
    label: 'Live Chat Rooms',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: 'Find Study Partners',
  },
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
    redirect('/courses');
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
              CMA · CFA · FE
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
              Don&apos;t Study Alone.
            </h1>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-blue-600 tracking-tight leading-tight mb-6">
              Connect with Professionals Worldwide.
            </h2>
            <p className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
              Find your study partner — someone working the same exam, the same schedule, the same grind. Practice together, hold each other accountable, and actually pass.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5"
              >
                Find Your Study Partner →
              </Link>
              <Link
                href="/courses"
                className="w-full sm:w-auto text-gray-600 hover:text-gray-900 font-semibold px-8 py-4 rounded-xl text-base transition-colors border border-gray-200 hover:border-gray-300"
              >
                Browse Courses
              </Link>
            </div>
            <p className="mt-5 text-sm text-gray-400">15 free questions · No credit card · Join your people</p>
          </div>
        </section>

        {/* ── Situation Hook Strip ── */}
        <section className="bg-gray-50 py-16 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOOKS.map((h) => (
              <div key={h.headline} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm flex flex-col gap-3">
                <span className="text-3xl">{h.icon}</span>
                <h3 className="font-black text-gray-900 text-lg leading-snug">{h.headline}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{h.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
              <p className="text-gray-500 max-w-xl mx-auto">From zero to study group in under five minutes.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((step) => (
                <div key={step.number} className="flex flex-col">
                  <div className="w-12 h-12 bg-blue-600 text-white font-black text-sm rounded-2xl flex items-center justify-center mb-4 flex-shrink-0">
                    {step.number}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── About Us ── */}
        <section className="bg-blue-600 py-20 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-4">About Us</p>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
                Connect.<br />Collaborate.<br />Conquer.
              </h2>
              <p className="text-blue-200 text-sm font-semibold">
                Built by professionals, for professionals.
              </p>
            </div>
            <div className="space-y-5 text-blue-100 text-base leading-relaxed">
              <p>
                We built this platform because we lived the struggle — studying for high-stakes professional exams after a full day of work, with no one around who truly got it.
              </p>
              <p>
                <strong className="text-white">We&apos;re not just a question bank.</strong> We&apos;re a community of working professionals who show up every night, open their laptops, and chip away at something that matters. The CPA. The CFA. The FE. The CMA.
              </p>
              <p>
                Every feature on this platform — the chat rooms, the study twins, the after-work study groups — exists because of one belief: you go further when you go together.
              </p>
            </div>
          </div>
        </section>

        {/* ── Courses ── */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Courses available</h2>
              <p className="text-gray-500 max-w-xl mx-auto">15 free questions per course. Go Pro for unlimited access.</p>
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
                    <span className="text-blue-600 font-bold">{course.exam_type === 'CMA' ? '$59' : '$49'} Pro · 15 Free</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Feature Pills ── */}
        <section className="bg-gray-50 py-14 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Everything included</p>
            <div className="flex flex-wrap justify-center gap-3">
              {FEATURES.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-full shadow-sm"
                >
                  <span className="text-blue-600">{f.icon}</span>
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="bg-gray-900 py-20 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to meet your study partner?</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Join professionals around the world preparing for the CMA, CFA, and FE. Free to start — no card required. Your people are already inside.
            </p>
            <Link
              href="/register"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-xl text-base transition-colors shadow-xl"
            >
              Join the Community →
            </Link>
            <p className="mt-4 text-sm text-gray-500">15 free questions per course · Cancel anytime</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
