import Link from 'next/link';
import { redirect } from 'next/navigation';
import { APP_CONFIG } from '@/lib/utils/constants';
import { createClient } from '@/lib/supabase/server';

/* ── Data ──────────────────────────────────────────── */
const COURSES = [
  {
    exam_type: 'CMA',
    name: 'Certified Management Accountant',
    description: 'Financial planning, analysis, control, decision support, and professional ethics.',
    price: '$59',
    color: 'from-amber-400 to-orange-400',
    badge: 'Most Popular',
    badgeColor: 'bg-amber-500',
  },
  {
    exam_type: 'CFA',
    name: 'Chartered Financial Analyst',
    description: 'Portfolio management, equity analysis, fixed income, derivatives, and ethics.',
    price: '$49',
    color: 'from-violet-400 to-purple-500',
    badge: null,
    badgeColor: '',
  },
  {
    exam_type: 'FE',
    name: 'Fundamentals of Engineering',
    description: 'Mathematics, engineering sciences, and discipline-specific technical topics.',
    price: '$49',
    color: 'from-teal-400 to-cyan-500',
    badge: null,
    badgeColor: '',
  },
];

const FEATURES = [
  {
    title: 'Adaptive Practice',
    body: 'Questions that surface your weak spots and target them until you\'re strong.',
  },
  {
    title: 'Timed Exam Simulator',
    body: 'Full mock exams under real conditions — timer, question navigation, auto-submit.',
  },
  {
    title: 'Study Community',
    body: 'Live chat rooms full of professionals grinding the same exam as you. At 11 PM.',
  },
];

const HOW_STEPS = [
  { num: '01', title: 'Sign up free', body: 'No credit card needed. 15 free questions per course, immediately.' },
  { num: '02', title: 'Pick your exam', body: 'CMA, CFA, or FE — tell us your goal and we\'ll tailor the experience.' },
  { num: '03', title: 'Start practicing', body: 'Work through questions, build streaks, and track your progress daily.' },
];

const STATS = [
  { value: '10,000+', label: 'Questions in the bank' },
  { value: '3',       label: 'Professional exams covered' },
  { value: '15',      label: 'Free questions to start' },
  { value: '24/7',    label: 'Community always online' },
];

/* ── Landing Page ──────────────────────────────────── */
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-white flex flex-col font-jakarta">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-200">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-green rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-lg font-extrabold text-neutral-900 tracking-tight">{APP_CONFIG.NAME}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors">
              Log in
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Start free →
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-green-50 to-amber-50 py-24 sm:py-32">
          {/* Decorative blobs */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-brand-amber/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 text-green-800
                              text-xs font-bold px-3 py-1.5 rounded-full mb-6 tracking-wide">
                CMA · CFA · FE Exam Prep
              </div>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-neutral-900 tracking-tight leading-[1.05] mb-5">
                Ace Your Exam.<br />
                <span className="text-brand-green">One Question</span><br />
                at a Time.
              </h1>
              <p className="text-lg text-neutral-500 leading-relaxed mb-8 max-w-md">
                Adaptive practice questions, timed mock exams, streaks — and a community of professionals
                studying the same exam as you.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Link href="/register" className="btn-primary-lg">
                  Start for free →
                </Link>
                <Link href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base
                             font-semibold text-neutral-600 border border-neutral-200 hover:border-neutral-300
                             hover:bg-neutral-50 transition-all">
                  See how it works
                </Link>
              </div>
              <p className="text-xs text-neutral-400 mt-4 font-medium">
                15 free questions · No credit card · Join instantly
              </p>
            </div>

            {/* Right: mock question card */}
            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-sm">
                {/* Floating decorative card behind */}
                <div className="absolute -top-4 -right-4 w-full h-full bg-brand-amber/20 rounded-3xl rotate-3" />
                <div className="relative bg-white rounded-3xl shadow-card-hover p-6 border border-neutral-100">
                  {/* Progress bar */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-neutral-500">Question 3 of 10</span>
                    <span className="text-xs font-bold text-brand-green">3 day streak</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full mb-5">
                    <div className="h-full bg-brand-green rounded-full" style={{ width: '30%' }} />
                  </div>

                  <p className="text-xs font-bold text-brand-amber mb-2 uppercase tracking-wide">
                    Financial Reporting
                  </p>
                  <p className="text-sm font-semibold text-neutral-800 mb-5 leading-snug">
                    Under IFRS, which method is required for investment property valuation?
                  </p>

                  {/* Options */}
                  {['Cost model only', 'Fair value model or cost model', 'Historical cost only', 'Net realisable value'].map((opt, i) => (
                    <div
                      key={opt}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-2 text-sm font-semibold
                        ${i === 1
                          ? 'border-brand-green bg-green-50 text-green-800'
                          : 'border-neutral-100 text-neutral-600 bg-neutral-50'}`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0
                        ${i === 1 ? 'bg-brand-green text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                        {['A','B','C','D'][i]}
                      </span>
                      {opt}
                      {i === 1 && <span className="ml-auto">✓</span>}
                    </div>
                  ))}

                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-xs text-green-800 font-semibold">
                      ✓ Correct! +10 XP earned
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section className="bg-neutral-900 py-10">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-extrabold text-brand-green">{value}</p>
                <p className="text-xs text-neutral-400 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="bg-neutral-100 py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-3">
                Everything you need to pass
              </h2>
              <p className="text-neutral-500 max-w-lg mx-auto">
                Built by professionals who passed these exams and know what actually works.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEATURES.map(({ title, body }) => (
                <div key={title} className="card-hover p-7 flex flex-col gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-neutral-900 text-base mb-1">{title}</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="bg-white py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-3">
                Up and studying in 2 minutes
              </h2>
              <p className="text-neutral-500">No setup. No credit card. Just start.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {HOW_STEPS.map(({ num, title, body }) => (
                <div key={num} className="flex flex-col">
                  <div className="w-12 h-12 bg-brand-green text-white font-black text-sm rounded-2xl
                                  flex items-center justify-center mb-5 flex-shrink-0">
                    {num}
                  </div>
                  <h3 className="font-extrabold text-neutral-900 mb-2">{title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Gamification preview ── */}
        <section className="bg-gradient-to-br from-amber-50 to-green-50 py-20 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="section-label mb-3">Built to keep you motivated</p>
              <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-4">
                Study streaks, XP, and badges — because you deserve a reward for showing up.
              </h2>
              <p className="text-neutral-500 text-sm leading-relaxed mb-6">
                Every question you answer earns XP. Build streaks. Unlock badges. See your skill
                level improve by topic. It&apos;s not just studying — it&apos;s progress you can feel.
              </p>
              <Link href="/register" className="btn-primary">
                Start earning XP →
              </Link>
            </div>

            {/* Mock gamification UI */}
            <div className="bg-white rounded-3xl shadow-card p-6 border border-neutral-100 space-y-4">
              {/* Streak */}
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <svg className="w-7 h-7 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67z"/></svg>
                <div>
                  <p className="font-extrabold text-amber-800">14 Day Streak</p>
                  <p className="text-xs text-amber-600">You&apos;re on fire! Don&apos;t break it.</p>
                </div>
                <span className="ml-auto text-2xl font-black text-amber-500">14</span>
              </div>

              {/* XP bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-neutral-600">Level 7 — 2,340 XP</span>
                  <span className="text-xs text-neutral-400">660 to Level 8</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '78%' }} />
                </div>
              </div>

              {/* Badges */}
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">Recent Badges</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { name: 'Sharp Shooter', color: 'bg-blue-100', stroke: '#3B82F6' },
                    { name: 'On Fire',        color: 'bg-amber-100', stroke: '#F59E0B' },
                    { name: 'Bookworm',       color: 'bg-green-100', stroke: '#22C55E' },
                    { name: 'Speed Demon',    color: 'bg-purple-100', stroke: '#A855F7' },
                  ].map(b => (
                    <div key={b.name} title={b.name}
                      className={`w-10 h-10 ${b.color} rounded-xl flex items-center justify-center`}>
                      <svg className="w-5 h-5" fill="none" stroke={b.stroke} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </div>
                  ))}
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-400 text-xs font-bold">
                    +12
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Courses ── */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-3">
                Choose your exam
              </h2>
              <p className="text-neutral-500">15 free questions per course. Unlock unlimited with Pro.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {COURSES.map((course) => (
                <div key={course.exam_type}
                  className="card-hover p-7 relative overflow-hidden group">
                  {course.badge && (
                    <span className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest
                                     ${course.badgeColor} text-white px-2.5 py-1 rounded-full`}>
                      {course.badge}
                    </span>
                  )}
                  <div className={`w-14 h-14 bg-gradient-to-br ${course.color} rounded-2xl flex items-center
                                   justify-center mb-5 shadow-sm`}>
                    <span className="text-white font-black text-sm tracking-tight">{course.exam_type}</span>
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">
                    {course.exam_type}
                  </p>
                  <h3 className="font-extrabold text-neutral-900 mb-2 text-base leading-snug">
                    {course.name}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed mb-6">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-neutral-400">15 free questions</span>
                    <span className="text-sm font-extrabold text-brand-green">{course.price} Pro</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── About Us ── */}
        <section className="bg-neutral-900 py-20 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="section-label text-neutral-500 mb-3">About Us</p>
              <h2 className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
                Built by professionals,<br />for professionals.
              </h2>
            </div>
            <div className="space-y-4 text-neutral-400 text-sm leading-relaxed">
              <p>
                We built this because we lived the struggle — studying for high-stakes exams after a full
                day of work, with no one around who truly got it.
              </p>
              <p>
                <strong className="text-white">We&apos;re not just a question bank.</strong> We&apos;re a
                community of working professionals who show up every night and chip away at something
                that matters.
              </p>
              <p>
                Every chat room, every badge, every question — built because you go further when you
                go together.
              </p>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="bg-gradient-to-br from-brand-green to-teal-500 py-20 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">
              Ready to start? It&apos;s free.
            </h2>
            <p className="text-green-100 mb-8 leading-relaxed">
              Join professionals around the world preparing for the CMA, CFA, and FE.
              15 free questions. No card required.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-brand-green font-extrabold
                         px-10 py-4 rounded-xl text-base hover:bg-green-50 transition-all shadow-xl
                         hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Join the community →
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-neutral-900 border-t border-neutral-800 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-green rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-bold text-white text-sm">{APP_CONFIG.NAME}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-xs text-neutral-500 hover:text-white transition-colors">Log in</Link>
            <Link href="/register" className="text-xs text-neutral-500 hover:text-white transition-colors">Sign up</Link>
            <Link href="/courses" className="text-xs text-neutral-500 hover:text-white transition-colors">Courses</Link>
          </div>
          <p className="text-xs text-neutral-600">
            © {new Date().getFullYear()} {APP_CONFIG.NAME}
          </p>
        </div>
      </footer>
    </div>
  );
}
