'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { QuestionFilters } from '@/components/question/QuestionFilters';
import { QuestionCard } from '@/components/question/QuestionCard';
import { Pagination } from '@/components/ui/Pagination';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { QuestionHeader } from '@/components/question/Navigation';
import { getAttemptedQuestionIds } from '@/lib/supabase/queries/userStats';

// --- Types ---
interface Question {
  id: number;
  exam_type: string;
  category: string;
  difficulty: string;
  question_text: string;
  is_attempted?: boolean;
}

interface FilterOptions {
  examTypes: string[];
  categories: string[];
  difficulties: string[];
}

const ITEMS_PER_PAGE = 10;

export default function QuestionsDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filter Option Lists
  const [options, setOptions] = useState<FilterOptions>({
    examTypes: [],
    categories: [],
    difficulties: []
  });

  // Active Filter State
  const [examType, setExamType] = useState('all');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchFilters = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('exam_type, category, difficulty');

      if (error) throw error;
      if (data) {
        setOptions({
          examTypes: Array.from(new Set(data.map(i => i.exam_type))).sort() as string[],
          categories: Array.from(new Set(data.map(i => i.category))).sort() as string[],
          difficulties: Array.from(new Set(data.map(i => i.difficulty))).sort() as string[],
        });
      }
    } catch (err: any) {
      console.error("Error fetching filters:", err.message);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      setUser(session.user);
      setAuthLoading(false);
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
  }, [router, fetchFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchQuestions = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // Fetch attempted question IDs
      const attemptedIds = await getAttemptedQuestionIds();

      let query = supabase.from('questions').select('*', { count: 'exact' });

      if (examType !== 'all') query = query.eq('exam_type', examType);
      if (category !== 'all') query = query.eq('category', category);
      if (difficulty !== 'all') query = query.eq('difficulty', difficulty);

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const { data, count, error } = await query
        .order('id', { ascending: false })
        .range(from, from + ITEMS_PER_PAGE - 1);

      if (error) throw error;

      // Mark questions as attempted if they exist in attemptedIds
      const questionsWithStatus = (data || []).map(q => ({
        ...q,
        is_attempted: attemptedIds.has(q.id)
      }));

      setQuestions(questionsWithStatus as Question[]);
      setTotalCount(count || 0);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch questions.");
    } finally {
      setLoading(false);
    }
  }, [examType, category, difficulty, currentPage, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <Header user={user} />

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 pt-24">
        {/* QuestionHeader Component from Navigation.tsx */}
        <QuestionHeader />

        <QuestionFilters 
          examType={examType} setExamType={(v) => {setExamType(v); setCurrentPage(1);}}
          category={category} setCategory={(v) => {setCategory(v); setCurrentPage(1);}}
          difficulty={difficulty} setDifficulty={(v) => {setDifficulty(v); setCurrentPage(1);}}
          options={options}
          totalCount={totalCount}
        />

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-3">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4 mb-8">
          {loading ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
               <p className="text-gray-500 font-medium">Fetching from database...</p>
            </div>
          ) : questions.length > 0 ? (
            questions.map((q) => <QuestionCard key={q.id} question={q} />)
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">No results found for the current filters.</p>
              <button onClick={() => {setExamType('all'); setCategory('all'); setDifficulty('all'); setCurrentPage(1);}} className="mt-4 text-blue-600 font-bold hover:underline">Clear all filters</button>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mb-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}