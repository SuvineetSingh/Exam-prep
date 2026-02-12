'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function PracticeSetup() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [examFilter, setExamFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function getCategories() {
      const supabase = createClient();
      const { data } = await supabase.from('questions').select('category');
      if (data) {
        const unique = Array.from(new Set(data.map((item) => item.category).filter(Boolean)));
        setCategories(unique as string[]);
      }
    }
    getCategories();
  }, []);

  const handleStart = async () => {
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    let query = supabase.from('questions').select('id').order('id', { ascending: true });

    if (examFilter !== 'all') query = query.eq('exam_type', examFilter);
    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter);

    const { data } = await query.limit(1).single();

    if (data) {
      router.push(`/practice/${data.id}?exam=${examFilter}&cat=${categoryFilter}`);
    } else {
      setErrorMsg('No questions found for this selection. Try a different filter.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative">
      <div className="absolute top-8 left-8">
        <Link
          href="/questions"
          className="group flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-all font-bold text-sm"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
            ←
          </div>
          BACK
        </Link>
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Practice Mode</h1>
          <p className="text-gray-500 mt-2">Select your focus area to begin.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2 ml-1">Exam Type</label>
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all cursor-pointer"
            >
              <option value="all">All Exams</option>
              <option value="CPA">CPA</option>
              <option value="FE">FE</option>
              <option value="CFA">CFA</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2 ml-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Finding Question...' : 'Start Practice →'}
          </button>
        </div>
      </div>
    </div>
  );
}
