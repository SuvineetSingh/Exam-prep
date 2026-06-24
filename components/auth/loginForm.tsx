'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { updateUserOnlineStatus } from '@/lib/supabase/queries/lobbyQueries';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null; message: string | null }>({
    type: null,
    message: null,
  });

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setStatus({ type: 'error', message: error.message });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: null, message: null });

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus({
        type: 'error',
        message: error.message || "We couldn't find an account with those details.",
      });
      setIsSubmitting(false);
    } else {
      setStatus({ type: 'success', message: 'Login successful! Redirecting...' });

      // Set user as online immediately after login
      if (data.user) {
        await updateUserOnlineStatus(data.user.id);
      }

      // Keep isSubmitting true during the redirect phase
      const redirectedFrom = searchParams.get('redirectedFrom');
      setTimeout(() => {
        router.push(redirectedFrom || '/dashboard');
        router.refresh();
      }, 1200);
    }
  };

  const showSuccess = status.type === 'success';
  const showError = status.type === 'error';

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4 w-full">
      <div className="w-full max-w-md card p-6 sm:p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Welcome back!</h1>
          <p className="text-neutral-500 mt-2">Log in to your account to continue</p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="btn-secondary w-full py-2.5 mb-8"
        >
          <img src="https://www.svgrepo.com/show/355037/google.svg" className="h-5 w-5" alt="" />
          Continue with Google
        </button>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest">
            <span className="bg-white px-4 text-neutral-400 font-medium">or email</span>
          </div>
        </div>

        {showError && (
          <div role="alert" className="mb-6 p-4 bg-red-50 border-l-4 border-brand-coral text-red-700 text-sm rounded-r-md">
            {status.message}
          </div>
        )}

        {showSuccess && (
          <div role="alert" className="mb-6 p-4 bg-green-50 border-l-4 border-brand-green text-green-700 text-sm rounded-r-md font-medium">
            {status.message}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div suppressHydrationWarning>
            <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-1 ml-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="name@example.com"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || showSuccess}
              suppressHydrationWarning
            />
          </div>

          <div suppressHydrationWarning>
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-1 ml-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || showSuccess}
              suppressHydrationWarning
            />
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-brand-green hover:underline font-medium">
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || showSuccess}
            className="btn-primary w-full py-3 text-base disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging in...
              </span>
            ) : showSuccess ? (
              'Redirecting...'
            ) : (
              'Log in'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-neutral-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-brand-green font-bold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}