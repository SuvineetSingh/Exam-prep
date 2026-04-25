'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUserActivity } from '@/hooks/useUserActivity';
import type { User } from '@supabase/supabase-js';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/courses', label: 'Courses' },
  { href: '/questions', label: 'Questions' },
  { href: '/lobby', label: 'Lobby' },
];

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
        className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-full flex items-center justify-center font-bold shadow-md hover:scale-105 transition-transform focus:outline-none relative"
      >
        {initial}
        {/* Online indicator */}
        <span
          className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"
          aria-label="Online"
        />
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
              ✕
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

export function SubscriptionBadge({ isPremium }: { isPremium: boolean | null }) {
  if (isPremium === null) return null;
  return isPremium ? (
    <span className="px-2 py-0.5 rounded text-xs font-semibold text-white bg-amber-500">
      Pro
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded text-xs font-semibold text-white bg-gray-600">
      Basic
    </span>
  );
}

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  // Track user activity and update online status
  useUserActivity(user.id);

  // Fetch subscription status
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('user_profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setIsPremium(data?.is_premium ?? false);
      });
  }, [user.id]);

  // Close drawer on Escape key
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const dropdownUser = {
    email: user.email,
    user_metadata: {
      full_name: user.user_metadata?.username || user.user_metadata?.full_name,
      username: user.user_metadata?.username || user.user_metadata?.full_name,
    },
  };

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.username ||
    user.email ||
    'User';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center h-full">

            {/* Brand logo */}
            <Link href="/" className="flex items-center space-x-2 flex-1">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">Exam Prep Platform</span>
              <span className="text-xl font-bold text-gray-900 sm:hidden">EPP</span>
            </Link>

            {/* Desktop: nav links + profile on the right */}
            <div className="hidden sm:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              <div className="ml-2 flex items-center gap-2">
                <SubscriptionBadge isPremium={isPremium} />
                <ProfileDropdown user={dropdownUser} onLogout={handleLogout} />
              </div>
            </div>

            {/* Mobile: profile + hamburger */}
            <div className="flex sm:hidden items-center gap-2">
              <ProfileDropdown user={dropdownUser} onLogout={handleLogout} />
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation menu"
                className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 sm:hidden ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out sm:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900 text-sm">{displayName}</p>
              <SubscriptionBadge isPremium={isPremium} />
            </div>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigate</p>
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors ${
                  active
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            );
          })}

          <div className="my-3 border-t border-gray-100" />

          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
          <Link
            href="/settings"
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors ${
              pathname === '/settings' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Settings
          </Link>
          <Link
            href="/history"
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors ${
              pathname === '/history' || pathname.startsWith('/history/') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Exam History
          </Link>
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={() => { setMenuOpen(false); handleLogout(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
