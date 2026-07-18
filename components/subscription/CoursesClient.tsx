'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CourseName, UserStats } from '@/lib/types';
import { COURSE_PRICE_DISPLAY } from '@/lib/utils/constants';
import { useCart } from '@/lib/cart/CartContext';

interface CourseData {
  exam_type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  questionCount: number;
}

interface CoursesClientProps {
  courses: CourseData[];
  purchasedCourses: CourseName[];
  displayName: string;
  stats: UserStats;
  successPending: boolean;
  sessionId?: string;
  successCourses?: string[];
}

const FREE_QUESTION_LIMIT = 15;

const COURSE_THEME: Record<string, {
  gradient: string;
  badge: string;
  badgeText: string;
  button: string;
  accent: string;
  accentBg: string;
}> = {
  CMA: {
    gradient: 'from-amber-500 via-orange-400 to-amber-600',
    badge: 'bg-amber-500',
    badgeText: 'Most Popular',
    button: 'bg-amber-600 hover:bg-amber-700',
    accent: 'text-amber-700',
    accentBg: 'bg-amber-50',
  },
  CFA: {
    gradient: 'from-violet-600 via-purple-500 to-violet-700',
    badge: 'bg-violet-600',
    badgeText: '',
    button: 'bg-violet-600 hover:bg-violet-700',
    accent: 'text-violet-700',
    accentBg: 'bg-violet-50',
  },
  FE: {
    gradient: 'from-teal-500 via-cyan-500 to-teal-600',
    badge: 'bg-teal-600',
    badgeText: '',
    button: 'bg-teal-600 hover:bg-teal-700',
    accent: 'text-teal-700',
    accentBg: 'bg-teal-50',
  },
};

const COURSE_DESCRIPTION: Record<string, { headline: string; features: string[] }> = {
  CMA: {
    headline: 'Master Management Accounting',
    features: ['Financial planning & analysis', 'Decision support & control', 'Professional ethics', 'Performance measurement'],
  },
  CFA: {
    headline: 'Become a Chartered Analyst',
    features: ['Portfolio management', 'Equity & fixed income', 'Derivatives & alternatives', 'Ethics & standards'],
  },
  FE: {
    headline: 'Crack the Engineering Exam',
    features: ['Mathematics & sciences', 'Engineering fundamentals', 'Discipline-specific topics', 'Computational methods'],
  },
};

export function CoursesClient({
  courses,
  purchasedCourses: initialPurchased,
  displayName: _displayName,
  stats,
  successPending,
  sessionId,
  successCourses,
}: CoursesClientProps) {
  const router = useRouter();
  const cart = useCart();
  const [purchasedCourses, setPurchasedCourses] = useState<CourseName[]>(initialPurchased);
  const [checkingPayment, setCheckingPayment] = useState(successPending && !!sessionId);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [successCourseNames, setSuccessCourseNames] = useState<string[]>(successCourses ?? []);

  useEffect(() => {
    if (!successPending || !sessionId) {
      setCheckingPayment(false);
      return;
    }
    async function verify() {
      const res = await fetch(`/api/stripe/verify?session_id=${sessionId}`);
      const data = await res.json();
      if (data.upgraded && data.courses?.length) {
        setPurchasedCourses((prev) => {
          const next = new Set(prev);
          data.courses.forEach((c: CourseName) => next.add(c));
          return Array.from(next);
        });
        data.courses.forEach((c: CourseName) => cart.removeItem(c));
        setSuccessCourseNames(data.courses);
        setShowSuccessBanner(true);
      } else if (data.upgraded) {
        setShowSuccessBanner(true);
      }
      setCheckingPayment(false);
      router.replace('/courses', { scroll: false });
    }
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuyNow = (course: string) => {
    cart.addItem(course as CourseName);
    router.push('/checkout');
  };

  const isNewUser = stats.total_answered === 0;

  return (
    <div className="space-y-10">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Study Streak',
            value: isNewUser ? '—' : `${stats.study_streak}d`,
            sub: isNewUser ? 'Answer a question to start' : `${stats.study_streak} days`,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            ),
            color: 'text-brand-amber',
            bg: 'bg-amber-50',
          },
          {
            label: 'Answered',
            value: isNewUser ? '0' : stats.total_answered.toLocaleString(),
            sub: isNewUser ? 'No questions yet' : `${stats.practice_answered} practice`,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            ),
            color: 'text-brand-blue',
            bg: 'bg-blue-50',
          },
          {
            label: 'Accuracy',
            value: isNewUser ? '—' : `${stats.accuracy_rate}%`,
            sub: isNewUser ? 'No data yet' : stats.accuracy_rate >= 80 ? 'Excellent' : stats.accuracy_rate >= 60 ? 'Good' : 'Keep practicing',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
            color: 'text-brand-green',
            bg: 'bg-green-50',
          },
          {
            label: 'Today',
            value: stats.today_count === 0 ? '0' : stats.today_count.toString(),
            sub: stats.today_count === 0 ? 'Nothing yet today' : `${stats.today_count} answered`,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            color: 'text-brand-purple',
            bg: 'bg-purple-50',
          },
        ].map((stat) => (
          <div key={stat.label} className="card px-4 py-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-neutral-400 mb-0.5">{stat.label}</p>
              <p className="text-xl font-extrabold text-neutral-900 leading-none">{stat.value}</p>
              <p className="text-[11px] text-neutral-400 mt-1 leading-tight">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Success banner */}
      {showSuccessBanner && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-green-800">
              Payment successful!{successCourseNames.length > 0 ? ` You now have Pro access to ${successCourseNames.join(', ')}.` : ' You now have Pro access.'}
            </p>
            <p className="text-sm text-green-600">A receipt has been sent to your email.</p>
          </div>
          <button onClick={() => setShowSuccessBanner(false)} className="ml-auto text-green-400 hover:text-green-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {checkingPayment && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-brand-blue text-sm font-medium">
          <div className="w-4 h-4 border-2 border-blue-400/30 border-t-brand-blue rounded-full animate-spin flex-shrink-0" />
          Verifying your payment...
        </div>
      )}

      {/* Course cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map((course) => {
          const theme = COURSE_THEME[course.exam_type] ?? COURSE_THEME['CMA']!;
          const extra = COURSE_DESCRIPTION[course.exam_type];
          const isPro = purchasedCourses.includes(course.exam_type as CourseName);
          const inCart = cart.isInCart(course.exam_type as CourseName);

          return (
            <div
              key={course.exam_type}
              className="rounded-[20px] overflow-hidden shadow-sm border border-neutral-200 hover:shadow-lg transition-shadow bg-white flex flex-col"
            >
              {/* Banner / image section */}
              <div className={`relative bg-gradient-to-br ${theme.gradient} h-40 flex items-end p-5`}>
                {/* Subtle geometric decoration */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-black/5" />
                </div>

                {isPro && (
                  <span className="absolute top-4 right-4 z-10 text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full border border-white/30">
                    Pro Access
                  </span>
                )}
                {!isPro && theme.badgeText && (
                  <span className={`absolute top-4 right-4 z-10 text-[10px] font-black uppercase tracking-widest ${theme.badge} text-white px-2.5 py-1 rounded-full`}>
                    {theme.badgeText}
                  </span>
                )}

                <div className="relative z-10">
                  <p className="text-white/70 text-[11px] font-bold uppercase tracking-[0.15em] mb-1">{course.exam_type}</p>
                  <h3 className="text-white font-extrabold text-xl leading-tight tracking-tight">
                    {extra?.headline ?? course.name}
                  </h3>
                </div>
              </div>

              {/* Content section */}
              <div className="p-5 flex flex-col flex-1 gap-4">
                <p className="text-sm text-neutral-500 leading-relaxed">{course.description}</p>

                {/* Features list */}
                {extra?.features && (
                  <ul className="space-y-1.5">
                    {extra.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-neutral-700">
                        <svg className={`w-4 h-4 flex-shrink-0 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Question count */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${theme.accentBg}`}>
                  <svg className={`w-4 h-4 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  <span className="text-sm font-semibold text-neutral-700">
                    {isPro
                      ? <><strong>{course.questionCount.toLocaleString()}</strong> questions — full access</>
                      : <><strong>{Math.min(FREE_QUESTION_LIMIT, course.questionCount)}</strong> free · {course.questionCount.toLocaleString()} total</>
                    }
                  </span>
                </div>

                {/* CTA */}
                <div className="mt-auto pt-1 space-y-2">
                  {isPro ? (
                    <Link
                      href={`/questions?exam=${course.exam_type}`}
                      className={`flex w-full items-center justify-center gap-1.5 py-3 px-4 rounded-[12px] text-white text-sm font-bold transition-colors ${theme.button}`}
                    >
                      Browse Questions
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => handleBuyNow(course.exam_type)}
                        className={`flex w-full items-center justify-center gap-2 py-3 px-4 rounded-[12px] text-white text-sm font-bold transition-colors ${theme.button}`}
                      >
                        Unlock Pro — {COURSE_PRICE_DISPLAY[course.exam_type] ?? '$49'}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            inCart
                              ? cart.removeItem(course.exam_type as CourseName)
                              : cart.addItem(course.exam_type as CourseName)
                          }
                          className={`flex-1 py-2 px-3 rounded-[10px] text-xs font-bold border transition-colors ${
                            inCart
                              ? 'border-brand-green text-brand-green bg-green-50 hover:bg-green-100'
                              : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                          }`}
                        >
                          {inCart ? 'In Cart — Remove' : 'Add to Cart'}
                        </button>
                        <Link
                          href={`/questions?exam=${course.exam_type}`}
                          className="flex-1 py-2 px-3 rounded-[10px] text-xs font-bold border border-neutral-200 text-neutral-600 hover:border-neutral-300 text-center transition-colors"
                        >
                          Try Free
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
