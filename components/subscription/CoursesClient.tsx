'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CourseName, UserStats } from '@/lib/types';
import { COURSE_PRICE_DISPLAY } from '@/lib/utils/constants';

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
  successCourse?: string;
}

const FREE_QUESTION_LIMIT = 15;

const colorMap = {
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    button: 'bg-amber-600 hover:bg-amber-700',
    proBadge: 'bg-green-100 text-green-700',
  },
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    badge: 'bg-violet-100 text-violet-700',
    button: 'bg-violet-600 hover:bg-violet-700',
    proBadge: 'bg-green-100 text-green-700',
  },
  teal: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    badge: 'bg-teal-100 text-teal-700',
    button: 'bg-teal-600 hover:bg-teal-700',
    proBadge: 'bg-green-100 text-green-700',
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
  successCourse,
}: CoursesClientProps) {
  const router = useRouter();
  const [purchasedCourses, setPurchasedCourses] = useState<CourseName[]>(initialPurchased);
  const [checkingPayment, setCheckingPayment] = useState(successPending && !!sessionId);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [successCourseName, setSuccessCourseName] = useState<string | null>(successCourse ?? null);
  // Per-course loading state
  const [loadingCourse, setLoadingCourse] = useState<string | null>(null);

  // Webhook fallback: verify payment if arriving from success URL
  useEffect(() => {
    if (!successPending || !sessionId) {
      setCheckingPayment(false);
      return;
    }

    async function verify() {
      const res = await fetch(`/api/stripe/verify?session_id=${sessionId}`);
      const data = await res.json();
      if (data.upgraded && data.course) {
        setPurchasedCourses((prev) =>
          prev.includes(data.course) ? prev : [...prev, data.course]
        );
        setSuccessCourseName(data.course);
        setShowSuccessBanner(true);
      } else if (data.upgraded) {
        setShowSuccessBanner(true);
      }
      setCheckingPayment(false);
      router.replace('/courses', { scroll: false });
    }

    verify();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckout = async (course: string) => {
    setLoadingCourse(course);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      console.error('Checkout error:', data.error ?? 'No URL returned');
    } catch (err) {
      console.error('Checkout request failed:', err);
    }
    setLoadingCourse(null);
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
              Payment successful!{successCourseName ? ` You now have Pro access to ${successCourseName}.` : ' You now have Pro access.'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {myCourses.map((course) => {
              const colors = colorMap[course.color as keyof typeof colorMap] ?? DEFAULT_COLOR;
              return (
                <div
                  key={course.exam_type}
                  className={`rounded-card border-2 ${colors.border} ${colors.bg} px-5 py-4 flex items-center gap-4 shadow-card`}
                >
                  <span className="text-2xl">{course.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 text-sm truncate">{course.name}</p>
                    <span className="text-xs font-bold text-brand-green">Pro Access ✓</span>
                  </div>
                  <Link
                    href={`/questions?exam=${course.exam_type}`}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-colors ${colors.button}`}
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
            const isLoading = loadingCourse === course.exam_type;
            const borderClass = isPro ? colors.border : 'border-neutral-200';

            return (
              <div
                key={course.exam_type}
                className={`rounded-card shadow-card border-2 overflow-hidden transition-all hover:shadow-card-hover ${borderClass}`}
              >
                {/* Card header */}
                <div className={`px-6 py-5 ${isPro ? colors.bg : 'bg-neutral-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{course.icon}</span>
                    {isPro ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                        Pro ✓
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-neutral-200 text-neutral-500">
                        {FREE_QUESTION_LIMIT} Free
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-neutral-900 leading-tight">{course.name}</h3>
                </div>

                {/* Card body */}
                <div className="px-6 py-5 space-y-4 bg-white">
                  <p className="text-sm text-neutral-500 leading-relaxed">{course.description}</p>

                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {isPro ? (
                        <><strong className="text-neutral-900">{course.questionCount.toLocaleString()}</strong> questions</>
                      ) : (
                        <><strong className="text-neutral-900">{FREE_QUESTION_LIMIT}</strong> of {course.questionCount.toLocaleString()} questions free</>
                      )}
                    </span>
                  </div>

                  {!isPro && (
                    <div className="progress-bar h-1.5">
                      <div
                        className="progress-fill h-1.5"
                        style={{ width: `${Math.min((FREE_QUESTION_LIMIT / Math.max(course.questionCount, 1)) * 100, 100)}%` }}
                      />
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
                    <div className="space-y-2">
                      <button
                        onClick={() => handleCheckout(course.exam_type)}
                        disabled={isLoading || loadingCourse !== null}
                        className={`block w-full text-center py-2.5 px-4 rounded-btn text-white text-sm font-bold transition-colors disabled:opacity-60 ${colors.button}`}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Redirecting...
                          </span>
                        ) : (
                          `Buy Pro Access — ${COURSE_PRICE_DISPLAY[course.exam_type] ?? '$49'}`
                        )}
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
