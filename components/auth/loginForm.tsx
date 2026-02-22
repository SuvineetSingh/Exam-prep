'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const router = useRouter();
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus({
        type: 'error',
        message: error.message || "We couldn't find an account with those details.",
      });
      setIsSubmitting(false);
    } else {
      setStatus({ type: 'success', message: 'Login successful! Redirecting...' });
      // Keep isSubmitting true during the redirect phase
      setTimeout(() => {
        router.push('/questions');
        router.refresh();
      }, 1200);
    }
  };

  const showSuccess = status.type === 'success';
  const showError = status.type === 'error';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 w-full">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back!</h1>
          <p className="text-slate-500 mt-2">Log in to your account to continue</p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all mb-8 shadow-sm"
        >
          <img src="https://www.svgrepo.com/show/355037/google.svg" className="h-5 w-5" alt="" />
          Continue with Google
        </button>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest">
            <span className="bg-white px-4 text-slate-400 font-medium">or email</span>
          </div>
        </div>

        {showError && (
          <div role="alert" className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded-r-md">
            {status.message}
          </div>
        )}

        {showSuccess && (
          <div role="alert" className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-400 text-emerald-700 text-sm rounded-r-md font-medium">
            {status.message}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1 ml-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-60"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || showSuccess}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1 ml-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-60"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || showSuccess}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || showSuccess}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50 active:scale-[0.99] flex justify-center items-center"
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

        <p className="mt-8 text-center text-slate-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 font-bold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}