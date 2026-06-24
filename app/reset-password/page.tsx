'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends the user here with an auth token in the URL fragment.
  // The @supabase/ssr client detects it automatically on the next auth state change.
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
        <div className="w-full max-w-md card p-6 sm:p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900">Password updated!</h2>
          <p className="text-sm text-neutral-500">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
      <div className="w-full max-w-md card p-6 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-neutral-900">Set new password</h1>
          <p className="text-neutral-500 mt-2 text-sm">Choose a strong password for your account.</p>
        </div>

        {!sessionReady && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl">
            Verifying your reset link... If this persists, the link may have expired.{' '}
            <Link href="/forgot-password" className="underline font-medium">Request a new one.</Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert" className="p-4 bg-red-50 border-l-4 border-brand-coral text-red-700 text-sm rounded-r-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-1 ml-1">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || !sessionReady}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-semibold text-neutral-700 mb-1 ml-1">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              required
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={isSubmitting || !sessionReady}
              className="input"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !sessionReady}
            className="btn-primary w-full py-3 text-base disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating...
              </span>
            ) : (
              'Update password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
