'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { PracticeSetupForm } from '@/components/practice/PracticeSetupForm';

export default function PracticeSetup() {
  const router = useRouter();
  const supabase = createClient();

  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [examFilter, setExamFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [examError, setExamError] = useState(false);

  // Fetch all distinct exam types once on mount
  const fetchExamTypes = useCallback(async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('exam_type');

    if (error) {
      console.error('Error loading exam types:', error.message);
      return;
    }

    if (data) {
      const unique = Array.from(new Set(data.map((i) => i.exam_type).filter(Boolean))).sort();
      setExamTypes(unique as string[]);
    }
  }, [supabase]);

  // Fetch categories filtered by selected exam type
  const fetchCategoriesForExam = useCallback(async (exam: string) => {
    if (!exam || exam === 'all') {
      setCategories([]);
      return;
    }

    const { data, error } = await supabase
      .from('questions')
      .select('category')
      .eq('exam_type', exam);

    if (error) {
      console.error('Error loading categories:', error.message);
      return;
    }

    if (data) {
      const unique = Array.from(new Set(data.map((i) => i.category).filter(Boolean))).sort();
      setCategories(unique as string[]);
    }
  }, [supabase]);

  useEffect(() => {
    fetchExamTypes();
  }, [fetchExamTypes]);

  // Re-fetch categories whenever the exam selection changes
  useEffect(() => {
    fetchCategoriesForExam(examFilter);
    setCategoryFilter('all'); // always reset category on exam change
  }, [examFilter, fetchCategoriesForExam]);

  const handleExamChange = (val: string) => {
    setExamFilter(val);
    setExamError(false); // clear error as soon as user picks something
  };

  const handleStart = async () => {
    // Enforce exam selection
    if (examFilter === 'all' || examFilter === '') {
      setExamError(true);
      return;
    }

    setLoading(true);
    const sessionId = uuidv4();

    let query = supabase.from('questions').select('id').order('id', { ascending: true });
    query = query.eq('exam_type', examFilter);
    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter);

    const { data } = await query.limit(1).single();

    if (data) {
      router.push(
        `/practice/${data.id}?exam=${examFilter}&cat=${categoryFilter}&session=${sessionId}`
      );
    } else {
      alert('No questions found for this selection!');
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

        <PracticeSetupForm
          examFilter={examFilter}
          setExamFilter={handleExamChange}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          options={{ examTypes, categories }}
          onStart={handleStart}
          loading={loading}
          examError={examError}
        />
      </div>
    </div>
  );
}