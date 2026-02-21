'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import zxcvbn from 'zxcvbn';

type StrengthLevel = {
  label: string;
  color: string;
  width: string;
};

export function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const passwordStrength = useMemo((): StrengthLevel => {
    const defaultLevel: StrengthLevel = { label: '', color: 'bg-gray-200', width: '0%' };
    if (!password) return defaultLevel;

    const result = zxcvbn(password);
    const strengthLevels: StrengthLevel[] = [
      { label: 'Very Weak', color: 'bg-red-600', width: '20%' },
      { label: 'Weak', color: 'bg-red-400', width: '40%' },
      { label: 'Fair', color: 'bg-yellow-500', width: '60%' },
      { label: 'Good', color: 'bg-blue-500', width: '80%' },
      { label: 'Strong', color: 'bg-green-500', width: '100%' },
    ];

    return strengthLevels[Math.min(result.score, strengthLevels.length - 1)]!;
  }, [password]);

  const handleGoogleSignup = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErrorMsg(error.message);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMsg('Password needs 8+ characters, a capital letter, a number, and a special character.');
      setLoading(false);
      return;
    }

    if (zxcvbn(password).score < 3) {
      setErrorMsg('This password is too easy to guess. Try adding more random words.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { username },
      },
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setShowSuccessPopup(true);
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-900 relative">
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Verify your email</h3>
            <p className="text-gray-600 mb-6">Check your email for the verification link.</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Create Account</h2>

        <button
          onClick={handleGoogleSignup}
          type="button"
          className="w-full flex items-center justify-center gap-3 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors mb-6 font-medium shadow-sm active:scale-[0.98]"
        >
          <img src="https://www.svgrepo.com/show/355037/google.svg" className="h-5 w-5" alt="Google" />
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500 font-medium">Or use email</span>
          </div>
        </div>

        <form onSubmit={handleEmailSignup} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-semibold text-gray-700 ml-1">Username</label>
            <input
              id="username"
              type="text"
              placeholder="johndoe123"
              value={username}
              className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 transition-all"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 transition-all"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-gray-700 ml-1">Password</label>
            <div className="space-y-2">
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 transition-all"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {password && (
                <div className="px-1">
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${passwordStrength.color}`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Security Score</p>
                    <p className={`text-[10px] font-bold uppercase ${passwordStrength.label === 'Strong' ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordStrength.label}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 ml-1">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              className={`w-full border p-2.5 rounded-lg outline-none focus:ring-2 transition-all border-gray-300 ${
                confirmPassword && password !== confirmPassword
                  ? 'focus:ring-red-500 border-red-300'
                  : 'focus:ring-blue-500'
              }`}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[11px] text-red-500 font-medium ml-1">Passwords do not match yet.</p>
            )}
          </div>

          {errorMsg && (
            <div role="alert" className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-all shadow-md active:scale-95 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registering...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}