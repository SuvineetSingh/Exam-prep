'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
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
          <span className={(hovered || value) >= star ? 'text-brand-amber' : 'text-neutral-200'}>★</span>
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
      <AppShell user={user}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="max-w-sm w-full card p-12 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-extrabold text-neutral-900 mb-2">Thank you!</h2>
            <p className="text-neutral-500 mb-8">Your feedback means a lot to us.</p>
            <Link href="/dashboard" className="btn-primary w-full justify-center py-4">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-1">Share Feedback</h1>
          <p className="text-neutral-500 text-sm">Help us improve your experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card p-7">
            <p className="font-bold text-neutral-800 mb-4">How would you rate your experience?</p>
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="mt-2 text-sm font-bold text-brand-amber">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
              </p>
            )}
          </div>

          <div className="card p-7">
            <p className="font-bold text-neutral-800 mb-4">Any thoughts or suggestions?</p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tell us what you love or what we can improve..."
              rows={5}
              className="input resize-none"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-4 justify-center text-base"
          >
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
