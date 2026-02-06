'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// --- Types ---
interface Question {
  id: number;
  exam_type: 'CPA' | 'CFA' | 'FE';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
}

export default function QuestionsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true); // Added to prevent UI flicker
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // --- Filter States ---
  const [examType, setExamType] = useState('all');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 1. Robust Auth Check & Listener
  useEffect(() => {
    const initAuth = async () => {
      // Use getSession first as it's faster for initial client checks
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);
      setAuthLoading(false);
    };

    initAuth();

    // Listen for auth changes (logout, session expiry)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // 2. Fetch Questions Logic
  const fetchQuestions = useCallback(async () => {
    if (authLoading) return; // Don't fetch until we know who the user is
    
    setLoading(true);
    setErrorMsg(null);

    try {
      let query = supabase
        .from('questions')
        .select('*', { count: 'exact' });

      if (examType !== 'all') query = query.eq('exam_type', examType);
      if (category !== 'all') query = query.eq('category', category);
      if (difficulty !== 'all') query = query.eq('difficulty', difficulty);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, count, error } = await query
        .order('id', { ascending: false }) // Changed from created_at to id as fallback
        .range(from, to);

      if (error) throw error;

      setQuestions(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch questions. Check RLS policies.");
    } finally {
      setLoading(false);
    }
  }, [examType, category, difficulty, page, authLoading]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // If we're still checking if the user is logged in, show a full-screen spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* --- NAVBAR --- */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <h1 className="text-xl font-black text-blue-600 tracking-tighter uppercase">ExamPrep AI</h1>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-400 uppercase">Candidate</p>
            <p className="text-sm font-semibold text-gray-700">{user?.user_metadata?.full_name || user?.email}</p>
          </div>
          <div className="group relative">
            <button className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-full flex items-center justify-center font-bold shadow-md hover:scale-105 transition-transform">
              {user?.email?.charAt(0).toUpperCase()}
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all invisible group-hover:visible z-50">
              <div className="p-2 border-b border-gray-50">
                 <p className="px-4 py-2 text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        
        {/* --- DASHBOARD HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Questions Browser</h2>
            <p className="text-gray-500 mt-1">Select a mode to begin your study session.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95">
              Practice Mode
            </button>
            <button className="flex-1 md:flex-none bg-white border-2 border-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95">
              Timed Exam
            </button>
          </div>
        </div>

        {/* --- FILTERS BAR --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap items-center gap-6 mb-8">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 ml-1">Exam Type</label>
            <select 
              value={examType} 
              onChange={(e) => {setExamType(e.target.value); setPage(1);}}
              className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
            >
              <option value="all">All Exams</option>
              <option value="CPA">CPA</option>
              <option value="FE">FE</option>
              <option value="CFA">CFA</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 ml-1">Category</label>
            <select 
              value={category} 
              onChange={(e) => {setCategory(e.target.value); setPage(1);}}
              className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
            >
              <option value="all">All Categories</option>
              <option value="Financial Accounting">Financial Accounting</option>
              <option value="Ethics">Ethics</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Statics">Statics</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 ml-1">Difficulty</label>
            <select 
              value={difficulty} 
              onChange={(e) => {setDifficulty(e.target.value); setPage(1);}}
              className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="pt-4">
             <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                {totalCount} Questions Found
             </span>
          </div>
        </div>

        {/* --- ERROR FEEDBACK --- */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errorMsg}
          </div>
        )}

        {/* --- QUESTIONS LIST --- */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
               <p className="text-gray-500 font-medium">Fetching from database...</p>
            </div>
          ) : questions.length > 0 ? (
            questions.map((q) => (
              <div key={q.id} className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-md shadow-sm">{q.exam_type}</span>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase rounded-md">{q.category}</span>
                  <span className={`ml-auto text-[10px] font-black uppercase px-2 py-1 rounded ${
                    q.difficulty === 'hard' ? 'text-red-600 bg-red-50' : 
                    q.difficulty === 'medium' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>
                <p className="text-gray-800 text-lg font-semibold leading-snug group-hover:text-blue-900 transition-colors">
                  {q.question_text}
                </p>
                <div className="mt-4 flex items-center text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  VIEW QUESTION <span className="ml-1">→</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">No results found for the current filters.</p>
              <button onClick={() => {setExamType('all'); setCategory('all'); setDifficulty('all');}} className="mt-4 text-blue-600 font-bold hover:underline">Clear all filters</button>
            </div>
          )}
        </div>

        {/* --- PAGINATION CONTROLS --- */}
        {totalCount > pageSize && (
          <div className="mt-12 flex items-center justify-center gap-6 pb-10">
            <button 
              disabled={page === 1 || loading}
              onClick={() => { setPage(p => p - 1); window.scrollTo(0,0); }}
              className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
            >
              ← Previous
            </button>
            <div className="flex items-center gap-2">
               <span className="text-sm font-bold text-gray-400">Page</span>
               <span className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg font-bold text-sm shadow-inner">{page}</span>
               <span className="text-sm font-bold text-gray-400 text-nowrap">of {Math.ceil(totalCount / pageSize)}</span>
            </div>
            <button 
              disabled={page * pageSize >= totalCount || loading}
              onClick={() => { setPage(p => p + 1); window.scrollTo(0,0); }}
              className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}