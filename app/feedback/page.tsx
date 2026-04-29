'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-4xl transition-transform hover:scale-110 focus:outline-none"
        >
          <span className={(hovered || value) >= star ? 'text-amber-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
      else setUser(user);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { setError('Please select a rating.'); return; }
    setError(null);
    setSubmitting(true);

    const { error: dbErr } = await createClient().from('user_feedback').insert({
      user_id: user?.id ?? null,
      overall_rating: rating,
      suggestions: message.trim() || null,
    });

    if (dbErr) { setError('Failed to submit. Please try again.'); setSubmitting(false); return; }
    setSubmitted(true);
    setSubmitting(false);
  };

  if (!user) return null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-sm w-full mx-4 bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Thank you!</h2>
            <p className="text-gray-500 mb-8">Your feedback means a lot to us.</p>
            <Link href="/dashboard" className="block w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="max-w-lg mx-auto px-4 py-8 pt-28">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-1">Share Feedback</h1>
          <p className="text-gray-500">Help us improve your experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
            <p className="font-bold text-gray-800 mb-4">How would you rate your experience?</p>
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="mt-2 text-sm font-bold text-amber-500">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
              </p>
            )}
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
            <p className="font-bold text-gray-800 mb-4">Any thoughts or suggestions?</p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tell us what you love or what we can improve..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:outline-none text-sm text-gray-700 placeholder-gray-300 resize-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </main>
    </div>
  );
}
