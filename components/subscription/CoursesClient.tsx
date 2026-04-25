'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  isPremium: boolean;
  successPending: boolean;
  sessionId?: string;
}

const FREE_QUESTION_LIMIT = 20;

const DEFAULT_COLOR = { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', button: 'bg-blue-600 hover:bg-blue-700' };
const colorMap: Record<string, { bg: string; border: string; badge: string; button: string }> = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-700',
    button: 'bg-indigo-600 hover:bg-indigo-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700',
  },
};

export function CoursesClient({
  courses,
  isPremium: initialPremium,
  successPending,
  sessionId,
}: CoursesClientProps) {
  const router = useRouter();
  const [isPremium, setIsPremium] = useState(initialPremium);
  const [checkingPayment, setCheckingPayment] = useState(successPending && !!sessionId);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Webhook fallback: verify payment if arriving from success URL
  useEffect(() => {
    if (!successPending || !sessionId || isPremium) {
      setCheckingPayment(false);
      if (successPending && isPremium) setShowSuccessBanner(true);
      return;
    }

    async function verify() {
      const res = await fetch(`/api/stripe/verify?session_id=${sessionId}`);
      const data = await res.json();
      if (data.upgraded) {
        setIsPremium(true);
        setShowSuccessBanner(true);
      }
      setCheckingPayment(false);
      // Clean up URL params without reload
      router.replace('/courses', { scroll: false });
    }

    verify();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    const res = await fetch('/api/stripe/checkout', { method: 'POST' });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success banner */}
      {showSuccessBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-emerald-800">Payment successful! You now have full access.</p>
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
          const colors = colorMap[course.color] ?? DEFAULT_COLOR;
          return (
            <div
              key={course.exam_type}
              className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-md ${
                isPremium ? colors.border : 'border-gray-200'
              }`}
            >
              {/* Card header */}
              <div className={`px-6 py-5 ${isPremium ? colors.bg : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{course.icon}</span>
                  {isPremium ? (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                      Full Access ✓
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
                    {isPremium ? (
                      <><strong className="text-gray-900">{course.questionCount.toLocaleString()}</strong> questions</>
                    ) : (
                      <><strong className="text-gray-900">{FREE_QUESTION_LIMIT}</strong> of {course.questionCount.toLocaleString()} questions free</>
                    )}
                  </span>
                </div>

                {!isPremium && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min((FREE_QUESTION_LIMIT / Math.max(course.questionCount, 1)) * 100, 100)}%` }}
                    />
                  </div>
                )}

                {isPremium ? (
                  <Link
                    href={`/questions?exam=${course.exam_type}`}
                    className={`block w-full text-center py-2.5 px-4 rounded-xl text-white text-sm font-bold transition-colors ${colors.button}`}
                  >
                    Browse Questions →
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href={`/questions?exam=${course.exam_type}`}
                      className="block w-full text-center py-2.5 px-4 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
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

      {/* Upgrade CTA — shown to free users */}
      {!isPremium && (
        <div className="mt-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Get Full Access — $50</h2>
          <p className="text-blue-100 mb-6 max-w-md mx-auto">
            One-time payment. Unlimited access to all CPA, CFA, and FE questions — forever.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm text-blue-200">
            {['Unlimited questions', 'All 3 courses', 'No expiry', 'Instant access'].map((f) => (
              <div key={f} className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </div>
            ))}
          </div>
          <button
            onClick={handleUpgrade}
            disabled={checkoutLoading}
            className="px-8 py-3.5 bg-white text-blue-700 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-md active:scale-95 disabled:opacity-60 flex items-center gap-2 mx-auto"
          >
            {checkoutLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-300/40 border-t-blue-600 rounded-full animate-spin" />
                Redirecting to checkout...
              </>
            ) : (
              'Upgrade for $50'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
