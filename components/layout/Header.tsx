'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProfileModal } from '@/components/ui/ProfileModal';

interface HeaderProps {
  user: {
    email: string;
    username?: string;
    avatar_url?: string;
  };
}

export function Header({ user }: HeaderProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
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
              <span className="text-xl font-bold text-gray-900 sm:hidden">
                EPP
              </span>
            </Link>

            {/* Profile Icon */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-full p-2 transition-colors"
              aria-label="Open profile menu"
            >
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
      />
    </>
  );
}
