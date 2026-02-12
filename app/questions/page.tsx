'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { QuestionRow, QuestionRowSkeleton } from '@/components/question/QuestionRow';
import { Pagination } from '@/components/ui/Pagination';
import { Footer } from '@/components/layout/Footer';
import type { DashboardQuestion } from '@/lib/types';

const ITEMS_PER_PAGE = 10;

export default function QuestionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<DashboardQuestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter states
  const [examType, setExamType] = useState('all');
  const [topic, setTopic] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Auth check
  useEffect(() => {
    const supabase = createClient();

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      setAuthLoading(false);
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
  }, [router]);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    let query = supabase.from('questions').select('*', { count: 'exact' });

    if (examType !== 'all') query = query.eq('exam_type', examType);
    if (topic !== 'all') query = query.eq('topic', topic);
    if (difficulty !== 'all') query = query.eq('difficulty', difficulty);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const { data, count, error } = await query
      .order('id', { ascending: false })
      .range(from, from + ITEMS_PER_PAGE - 1);

    if (error) {
      setErrorMsg(error.message);
    } else {
      // Map to DashboardQuestion, defaulting is_answered to false
      const dashboardQuestions: DashboardQuestion[] = (data || []).map((q) => ({
        ...q,
        is_answered: false,
      }));
      setQuestions(dashboardQuestions);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [examType, topic, difficulty, currentPage, authLoading]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <h1 className="text-xl font-black text-blue-600 tracking-tighter uppercase">ExamPrep</h1>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-400 uppercase">Candidate</p>
            <p className="text-sm font-semibold text-gray-700">
              {user?.user_metadata?.full_name || user?.email}
            </p>
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
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Questions Dashboard</h2>
          <p className="mt-2 text-sm text-gray-600">Practice questions for CPA, CFA, and FE exams</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap items-center gap-6 mb-6">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 ml-1">Exam Type</label>
            <select
              value={examType}
              onChange={handleFilterChange(setExamType)}
              className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
            >
              <option value="all">All Exams</option>
              <option value="CPA">CPA</option>
              <option value="CFA">CFA</option>
              <option value="FE">FE</option>
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 ml-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={handleFilterChange(setDifficulty)}
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

        {/* Error */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {errorMsg}
          </div>
        )}

        {/* Questions List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          {loading ? (
            Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <QuestionRowSkeleton key={i} />)
          ) : questions.length > 0 ? (
            questions.map((question) => (
              <QuestionRow key={question.id} question={question} />
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-400 font-medium">No results found for the current filters.</p>
              <button
                onClick={() => { setExamType('all'); setTopic('all'); setDifficulty('all'); }}
                className="mt-4 text-blue-600 font-bold hover:underline text-sm"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
