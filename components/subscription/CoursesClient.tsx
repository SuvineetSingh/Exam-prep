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
const METER_TICKS = 20;

const colorMap = {
  amber: {
    border: 'border-amber-200',
    accent: 'text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700',
    tick: 'bg-amber-500',
  },
  violet: {
    border: 'border-violet-200',
    accent: 'text-violet-600',
    button: 'bg-violet-600 hover:bg-violet-700',
    tick: 'bg-violet-500',
  },
  teal: {
    border: 'border-teal-200',
    accent: 'text-teal-600',
    button: 'bg-teal-600 hover:bg-teal-700',
    tick: 'bg-teal-500',
  },
};
const DEFAULT_COLOR = colorMap.amber;

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

  // Webhook fallback: verify payment if arriving from success URL
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

  const myCourses = courses.filter((c) => purchasedCourses.includes(c.exam_type as CourseName));

  const isNewUser = stats.total_answered === 0;

  return (
    <div className="space-y-10">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Study Streak',
            value: isNewUser ? '—' : `${stats.study_streak}d`,
            sub: isNewUser ? 'Answer a question to start' : stats.study_streak === 1 ? '1 day' : `${stats.study_streak} days`,
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
            sub: isNewUser ? 'No questions yet' : `${stats.practice_answered} practice · ${stats.timed_answered} timed`,
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
            sub: stats.today_count === 0 ? 'Nothing yet today' : `${stats.today_count} question${stats.today_count === 1 ? '' : 's'} answered`,
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
          <button
            onClick={() => setShowSuccessBanner(false)}
            className="ml-auto text-green-400 hover:text-green-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Verifying payment state */}
      {checkingPayment && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-brand-blue text-sm font-medium">
          <div className="w-4 h-4 border-2 border-blue-400/30 border-t-brand-blue rounded-full animate-spin flex-shrink-0" />
          Verifying your payment...
        </div>
      )}

      {/* My Courses — shown first if user has purchases */}
      {myCourses.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-neutral-900 mb-4">My Courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {myCourses.map((course) => {
              const colors = colorMap[course.color as keyof typeof colorMap] ?? DEFAULT_COLOR;
              return (
                <div
                  key={course.exam_type}
                  className="rounded-card border border-neutral-200 bg-paper px-4 py-3 flex items-center gap-3"
                >
                  <span className={`font-mono text-[11px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-md bg-white border border-neutral-200 ${colors.accent}`}>
                    {course.exam_type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 text-sm truncate">{course.name}</p>
                    <span className="text-xs font-bold text-brand-green flex items-center gap-1">
                      ✓ Pro Access
                    </span>
                  </div>
                  <Link
                    href={`/questions?exam=${course.exam_type}`}
                    className={`text-xs font-bold whitespace-nowrap hover:underline ${colors.accent}`}
                  >
                    Browse →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Courses */}
      <div>
        <h2 className="text-lg font-bold text-neutral-900 mb-4">All Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {courses.map((course) => {
            const colors = colorMap[course.color as keyof typeof colorMap] ?? DEFAULT_COLOR;
            const isPro = purchasedCourses.includes(course.exam_type as CourseName);
            const inCart = cart.isInCart(course.exam_type as CourseName);
            const freeCount = Math.min(FREE_QUESTION_LIMIT, course.questionCount);
            const ratio = course.questionCount > 0 ? freeCount / course.questionCount : 0;
            const filledTicks = Math.round(ratio * METER_TICKS);

            return (
              <div
                key={course.exam_type}
                className={`rounded-card border ${isPro ? colors.border : 'border-neutral-200'} bg-paper overflow-hidden transition-all hover:shadow-card-hover flex`}
              >
                {/* Stub */}
                <div className="w-20 sm:w-24 flex-shrink-0 flex flex-col items-center justify-between py-5 px-2">
                  <span className="text-2xl">{course.icon}</span>
                  <span className={`font-mono text-[11px] font-bold uppercase tracking-[0.15em] ${colors.accent}`}>
                    {course.exam_type}
                  </span>
                  {isPro ? (
                    <span
                      className={`-rotate-6 border-2 border-dashed rounded-full w-12 h-12 flex items-center justify-center font-mono text-[9px] font-bold uppercase tracking-wide ${colors.accent} ${colors.border}`}
                    >
                      Pro✓
                    </span>
                  ) : (
                    <span className="rotate-3 bg-neutral-100 border border-neutral-200 text-neutral-500 font-mono text-[9px] font-bold uppercase tracking-wide px-1.5 py-1 rounded">
                      {freeCount} Free
                    </span>
                  )}
                </div>

                <div className="ticket-seam" />

                {/* Body */}
                <div className="flex-1 px-5 py-5 space-y-3 min-w-0">
                  <h3 className="font-extrabold text-neutral-900 leading-tight tracking-tight">{course.name}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{course.description}</p>

                  <div className="text-sm text-neutral-600">
                    {isPro ? (
                      <span><strong className="text-neutral-900">{course.questionCount.toLocaleString()}</strong> questions</span>
                    ) : (
                      <span><strong className="text-neutral-900">{freeCount}</strong> of {course.questionCount.toLocaleString()} questions free</span>
                    )}
                  </div>

                  {!isPro && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: METER_TICKS }).map((_, i) => (
                        <span
                          key={i}
                          className={`h-3 w-1 rounded-sm ${i < filledTicks ? colors.tick : 'bg-neutral-200'}`}
                        />
                      ))}
                    </div>
                  )}

                  {isPro ? (
                    <Link
                      href={`/questions?exam=${course.exam_type}`}
                      className={`block w-full text-center py-2.5 px-4 rounded-btn text-white text-sm font-bold transition-colors ${colors.button}`}
                    >
                      Browse Questions →
                    </Link>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => handleBuyNow(course.exam_type)}
                        className={`block w-full text-center py-2.5 px-4 rounded-btn text-white text-sm font-bold transition-colors ${colors.button}`}
                      >
                        Buy Pro Access — {COURSE_PRICE_DISPLAY[course.exam_type] ?? '$49'}
                      </button>
                      <button
                        onClick={() =>
                          inCart
                            ? cart.removeItem(course.exam_type as CourseName)
                            : cart.addItem(course.exam_type as CourseName)
                        }
                        className={`btn-ghost block w-full py-2 ${inCart ? 'text-brand-green' : ''}`}
                      >
                        {inCart ? '✓ In Cart — Remove' : 'Add to Cart'}
                      </button>
                      <Link
                        href={`/questions?exam=${course.exam_type}`}
                        className="btn-ghost block w-full py-2"
                      >
                        Browse Free Questions
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
