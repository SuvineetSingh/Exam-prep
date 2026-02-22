'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PracticeSetupForm } from '@/components/practice/PracticeSetupForm';

export default function PracticeSetup() {
  const router = useRouter();
  const supabase = createClient();

  const [options, setOptions] = useState<{ examTypes: string[], categories: string[] }>({
    examTypes: [],
    categories: []
  });
  
  const [examFilter, setExamFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Fetch unique filter values dynamically from Supabase
  const fetchDynamicFilters = useCallback(async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('exam_type, category');

    if (error) {
      console.error("Error loading filters:", error.message);
      return;
    }

    if (data) {
      const uniqueExams = Array.from(new Set(data.map(i => i.exam_type).filter(Boolean))).sort();
      const uniqueCats = Array.from(new Set(data.map(i => i.category).filter(Boolean))).sort();
      
      setOptions({
        examTypes: uniqueExams as string[],
        categories: uniqueCats as string[]
      });
    }
  }, [supabase]);

  useEffect(() => {
    fetchDynamicFilters();
  }, [fetchDynamicFilters]);

  const handleStart = async () => {
    setLoading(true);
    let query = supabase.from('questions').select('id').order('id', { ascending: true });

    if (examFilter !== 'all') query = query.eq('exam_type', examFilter);
    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter);

    const { data } = await query.limit(1).single();

    if (data) {
      router.push(`/practice/${data.id}?exam=${examFilter}&cat=${categoryFilter}`);
    } else {
      alert("No questions found for this selection!");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative">
      
      {/* --- BACK BUTTON --- */}
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

      {/* --- SETTINGS CARD --- */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Practice Mode</h1>
          <p className="text-gray-500 mt-2">Select your focus area to begin.</p>
        </div>

        <PracticeSetupForm 
          examFilter={examFilter}
          setExamFilter={setExamFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          options={options}
          onStart={handleStart}
          loading={loading}
        />
      </div>
    </div>
  );
}