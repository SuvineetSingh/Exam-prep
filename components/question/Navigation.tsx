'use client';

import Link from 'next/link';

// --- Navbar Types ---
interface NavbarProps {
  user: any;
  onLogout: () => void;
}

// --- 1. Navbar Component ---
// Handles the logo, candidate name, and the sign-out dropdown
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
        <div className="group relative">
          <button className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-full flex items-center justify-center font-bold shadow-md hover:scale-105 transition-transform">
            {user?.email?.charAt(0).toUpperCase()}
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all invisible group-hover:visible z-50">
            <div className="p-2 border-b border-gray-50">
              <p className="px-4 py-2 text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <div className="p-2">
              <button 
                onClick={onLogout} 
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// --- 2. QuestionHeader Component ---
// Handles the "Questions Browser" title and the mode selection buttons
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