'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [authLoading, setAuthLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // --- Dynamic Filter Options States ---
  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);

  // --- Filter States ---
  const [examType, setExamType] = useState('all');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch unique filter values from Supabase
  const fetchFilters = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('exam_type, category, difficulty');

      if (error) throw error;

      if (data) {
        const uniqueExams = Array.from(new Set(data.map(item => item.exam_type))).sort();
        const uniqueCats = Array.from(new Set(data.map(item => item.category))).sort();
        const uniqueDiffs = Array.from(new Set(data.map(item => item.difficulty))).sort();

        setExamTypes(uniqueExams);
        setCategories(uniqueCats);
        setDifficulties(uniqueDiffs);
      }
    } catch (err: any) {
      console.error("Error fetching filters:", err.message);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);
      setAuthLoading(false);
      // Fetch dynamic filters once authenticated
      fetchFilters();
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, fetchFilters]);

  const fetchQuestions = useCallback(async () => {
    if (authLoading) return;
    
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
        .order('id', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setQuestions(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch questions.");
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
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

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap items-center gap-6 mb-8">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 ml-1">Exam Type</label>
            <select 
              value={examType} 
              onChange={(e) => {setExamType(e.target.value); setPage(1);}}
              className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
            >
              <option value="all">All Exams</option>
              {examTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
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
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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
              {difficulties.map((diff) => (
                <option key={diff} value={diff} className="capitalize">{diff}</option>
              ))}
            </select>
          </div>

          <div className="pt-4">
             <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                {totalCount} Questions Found
             </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-3">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
               <p className="text-gray-500 font-medium">Fetching from database...</p>
            </div>
          ) : questions.length > 0 ? (
            questions.map((q) => (
              <div key={q.id} className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group relative overflow-hidden">
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
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">No results found for the current filters.</p>
              <button onClick={() => {setExamType('all'); setCategory('all'); setDifficulty('all');}} className="mt-4 text-blue-600 font-bold hover:underline">Clear all filters</button>
            </div>
          )}
        </div>

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