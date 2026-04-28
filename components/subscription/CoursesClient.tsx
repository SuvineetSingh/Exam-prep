'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CourseName } from '@/lib/types';

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
  successPending: boolean;
  sessionId?: string;
  successCourse?: string;
}

const FREE_QUESTION_LIMIT = 20;

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700',
    proBadge: 'bg-emerald-100 text-emerald-700',
  },
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-700',
    button: 'bg-indigo-600 hover:bg-indigo-700',
    proBadge: 'bg-emerald-100 text-emerald-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    proBadge: 'bg-emerald-100 text-emerald-700',
  },
};
const DEFAULT_COLOR = colorMap.blue;

export function CoursesClient({
  courses,
  purchasedCourses: initialPurchased,
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
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoadingCourse(null);
    }
  };

  const myCourses = courses.filter((c) => purchasedCourses.includes(c.exam_type as CourseName));

  return (
    <div className="space-y-8">
      {/* Success banner */}
      {showSuccessBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-emerald-800">
              Payment successful!{successCourseName ? ` You now have Pro access to ${successCourseName}.` : ' You now have Pro access.'}
            </p>
            <p className="text-sm text-emerald-600">A receipt has been sent to your email.</p>
          </div>
          <button
            onClick={() => setShowSuccessBanner(false)}
            className="ml-auto text-emerald-400 hover:text-emerald-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Verifying payment state */}
      {checkingPayment && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-700 text-sm font-medium">
          <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
          Verifying your payment...
        </div>
      )}

      {/* Course cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map((course) => {
          const colors = colorMap[course.color as keyof typeof colorMap] ?? DEFAULT_COLOR;
          const isPro = purchasedCourses.includes(course.exam_type as CourseName);
          const isLoading = loadingCourse === course.exam_type;
          const borderClass = isPro ? colors.border : 'border-gray-200';

          return (
            <div
              key={course.exam_type}
              className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-md ${borderClass}`}
            >
              {/* Card header */}
              <div className={`px-6 py-5 ${isPro ? colors.bg : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{course.icon}</span>
                  {isPro ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Pro ✓
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                      {FREE_QUESTION_LIMIT} Free
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 leading-tight">{course.name}</h3>
              </div>

              {/* Card body */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-gray-500 leading-relaxed">{course.description}</p>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {isPro ? (
                      <><strong className="text-gray-900">{course.questionCount.toLocaleString()}</strong> questions</>
                    ) : (
                      <><strong className="text-gray-900">{FREE_QUESTION_LIMIT}</strong> of {course.questionCount.toLocaleString()} questions free</>
                    )}
                  </span>
                </div>

                {!isPro && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min((FREE_QUESTION_LIMIT / Math.max(course.questionCount, 1)) * 100, 100)}%` }}
                    />
                  </div>
                )}

                {isPro ? (
                  <Link
                    href={`/questions?exam=${course.exam_type}`}
                    className={`block w-full text-center py-2.5 px-4 rounded-xl text-white text-sm font-bold transition-colors ${colors.button}`}
                  >
                    Browse Questions →
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleCheckout(course.exam_type)}
                      disabled={isLoading || loadingCourse !== null}
                      className={`block w-full text-center py-2.5 px-4 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-60 ${colors.button}`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Redirecting...
                        </span>
                      ) : (
                        'Buy Pro Access — $50'
                      )}
                    </button>
                    <Link
                      href={`/questions?exam=${course.exam_type}`}
                      className="block w-full text-center py-2 px-4 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
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

      {/* My Courses section */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Courses</h2>
        {myCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 px-6 py-10 text-center text-gray-500">
            <p className="text-sm">No courses yet. Purchase a course above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {myCourses.map((course) => {
              const colors = colorMap[course.color as keyof typeof colorMap] ?? DEFAULT_COLOR;
              return (
                <div
                  key={course.exam_type}
                  className={`bg-white rounded-xl border-2 ${colors.border} px-5 py-4 flex items-center gap-4 shadow-sm`}
                >
                  <span className="text-2xl">{course.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{course.name}</p>
                    <span className="text-xs font-bold text-emerald-600">Pro Access ✓</span>
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
        )}
      </div>
    </div>
  );
}
