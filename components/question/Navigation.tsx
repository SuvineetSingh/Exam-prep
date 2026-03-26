'use client';

import Link from 'next/link';
// ProfileDropdown now lives in Header.tsx — import it from there
import { ProfileDropdown } from '@/components/layout/Header';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
      <h1 className="text-xl font-black text-blue-600 tracking-tighter uppercase">ExamPrep AI</h1>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-gray-400 uppercase leading-none">Candidate</p>
          <p className="text-sm font-semibold text-gray-700">
            {user?.user_metadata?.full_name || user?.email}
          </p>
        </div>
        <ProfileDropdown user={user} onLogout={onLogout} />
      </div>
    </nav>
  );
}

export function QuestionHeader() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Questions Browser</h2>
        <p className="text-gray-500 mt-1">Select a mode to begin your study session.</p>
      </div>
      <div className="flex gap-3 w-full md:w-auto">
        <Link
          href="/practice"
          className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 text-center"
        >
          Practice Mode
        </Link>
        <Link
          href="/timed-exam"
          className="flex-1 md:flex-none bg-white border-2 border-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95 text-center"
        >
          Timed Exam
        </Link>
      </div>
    </div>
  );
}