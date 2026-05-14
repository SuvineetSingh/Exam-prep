'use client';

import { useState } from 'react';
import Link from 'next/link';
import { COURSE_PRICE_DISPLAY } from '@/lib/utils/constants';

export const FREE_QUESTION_LIMIT = 15;
export const FREE_QUESTION_WARNING = 10;

interface PaywallBannerProps {
  examType: string;
  usedCount: number;
}

export function PaywallBanner({ examType, usedCount }: PaywallBannerProps) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course: examType }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 text-center space-y-4">
      <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <div>
        <h3 className="text-lg font-bold text-amber-900 mb-1">
          You've used all {FREE_QUESTION_LIMIT} free {examType} questions
        </h3>
        <p className="text-sm text-amber-700 max-w-xs mx-auto">
          Unlock unlimited access to all {examType} questions with Pro access for a one-time payment of {COURSE_PRICE_DISPLAY[examType] ?? '$49'}.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={handleUpgrade}
          disabled={checkoutLoading}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {checkoutLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Redirecting...
            </>
          ) : (
            `Buy ${examType} Pro — ${COURSE_PRICE_DISPLAY[examType] ?? '$49'} →`
          )}
        </button>
        <Link
          href="/courses"
          className="px-6 py-2.5 bg-white border border-amber-300 text-amber-700 rounded-xl font-semibold text-sm hover:bg-amber-50 transition-colors text-center"
        >
          See all courses
        </Link>
      </div>

      <p className="text-xs text-amber-600">
        You've answered {usedCount} unique questions in this course.
      </p>
    </div>
  );
}

interface RunningLowBannerProps {
  examType: string;
  remaining: number;
}

export function RunningLowBanner({ examType, remaining }: RunningLowBannerProps) {
  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-start gap-3 text-sm">
      <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="text-yellow-800">
        <strong>{remaining} free {examType} question{remaining === 1 ? '' : 's'} remaining.</strong>{' '}
        <Link href="/courses" className="underline font-semibold hover:text-yellow-900">
          Get Pro access →
        </Link>
      </span>
    </div>
  );
}
