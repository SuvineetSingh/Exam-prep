'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart/CartContext';
import { COURSE_PRICE_DISPLAY, COURSE_PRICES_CENTS } from '@/lib/utils/constants';
import type { CourseName } from '@/lib/types';

interface CourseMeta {
  exam_type: string;
  name: string;
  icon: string;
}

interface CheckoutClientProps {
  courses: readonly CourseMeta[];
  purchasedCourses: CourseName[];
}

export function CheckoutClient({ courses, purchasedCourses }: CheckoutClientProps) {
  const cart = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drop anything already owned (e.g. a stale cart entry from before purchase)
  useEffect(() => {
    cart.items.forEach((c) => {
      if (purchasedCourses.includes(c)) cart.removeItem(c);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = cart.items.filter((c) => !purchasedCourses.includes(c));
  const total = items.reduce((sum, c) => sum + (COURSE_PRICES_CENTS[c] ?? 4900), 0);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: items }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? 'Checkout failed. Please try again.');
    } catch {
      setError('Checkout request failed. Check your connection and try again.');
    }
    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <div className="card p-16 text-center border-2 border-dashed border-neutral-200">
        <p className="text-4xl mb-3">🛒</p>
        <p className="font-bold text-neutral-700 mb-1">Your cart is empty</p>
        <p className="text-neutral-400 text-sm mb-5">Add a course to get started.</p>
        <Link href="/courses" className="btn-primary inline-flex">Browse Courses →</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="card divide-y divide-neutral-100 mb-4">
        {items.map((code) => {
          const meta = courses.find((c) => c.exam_type === code);
          return (
            <div key={code} className="flex items-center gap-4 p-5">
              <span className="text-2xl">{meta?.icon ?? '📘'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-neutral-900 text-sm truncate">{meta?.name ?? code}</p>
                <p className="text-xs text-neutral-400">Pro Access — one-time payment</p>
              </div>
              <p className="font-bold text-neutral-900">{COURSE_PRICE_DISPLAY[code] ?? '$49'}</p>
              <button
                onClick={() => cart.removeItem(code)}
                title="Remove from cart"
                className="text-neutral-300 hover:text-brand-coral transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <div className="card p-5 mb-4 flex items-center justify-between">
        <span className="font-bold text-neutral-700">Total</span>
        <span className="text-2xl font-extrabold text-neutral-900">${(total / 100).toFixed(2)}</span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="btn-primary w-full py-4 justify-center text-base disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Redirecting to payment...
          </span>
        ) : (
          `Complete Purchase — $${(total / 100).toFixed(2)}`
        )}
      </button>
      <Link href="/courses" className="btn-ghost block w-full text-center py-3 mt-2">
        ← Continue browsing
      </Link>
    </div>
  );
}
