'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ── Shared dropdown — exported for use in Navigation.tsx (questions page) ──
export function ProfileDropdown({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.username ||
    user?.username ||
    'User';
  const email = user?.email || '';
  const initial = email.charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-full flex items-center justify-center font-bold shadow-md hover:scale-105 transition-transform focus:outline-none"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">

          {/* User info header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 shadow">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 text-sm truncate">{displayName}</p>
              <p className="text-xs text-gray-400 truncate">{email}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors flex-shrink-0 text-xs"
            >
              x
            </button>
          </div>

          {/* Menu items */}
          <div className="px-2 py-2 border-b border-gray-100">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base">
                &#9881;
              </span>
              Account Settings
            </Link>
            <Link
              href="/preferences"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base">
                &#9883;
              </span>
              Preferences
            </Link>
            <Link
              href="/history"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base">
                &#9202;
              </span>
              Exam History
            </Link>
          </div>

          {/* Logout */}
          <div className="px-2 py-2">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-base font-bold">
                &#8617;
              </span>
              Logout
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

interface HeaderProps {
  user: {
    email: string;
    username?: string;
    avatar_url?: string;
  };
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Adapt flat props to the shape ProfileDropdown expects
  const dropdownUser = {
    email: user.email,
    user_metadata: {
      full_name: user.username,
      username: user.username,
    },
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              Exam Prep Platform
            </span>
            <span className="text-xl font-bold text-gray-900 sm:hidden">EPP</span>
          </Link>

          <ProfileDropdown user={dropdownUser} onLogout={handleLogout} />
        </div>
      </div>
    </header>
  );
}