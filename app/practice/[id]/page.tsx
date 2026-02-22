'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PracticeSessionUI } from '@/components/practice/PracticeSessionUI';

export default function SingleQuestionPractice() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const exam = searchParams.get('exam') || 'all';
  const cat = searchParams.get('cat') || 'all';

  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFirst, setIsFirst] = useState(false);
  const [isLast, setIsLast] = useState(false);
  const [navIds, setNavIds] = useState<{ prev: number | null, next: number | null }>({ prev: null, next: null });

  const fetchQuestionAndBoundaries = useCallback(async () => {
    setLoading(true);
    const currentId = Number(id);

    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('id', currentId)
      .single();
    
    if (data) {
      setQuestion(data);
      setIsSubmitted(false);
      setSelectedOption(null);

      let prevQuery = supabase.from('questions').select('id').lt('id', currentId).order('id', { ascending: false });
      let nextQuery = supabase.from('questions').select('id').gt('id', currentId).order('id', { ascending: true });

      if (exam !== 'all') {
        prevQuery = prevQuery.eq('exam_type', exam);
        nextQuery = nextQuery.eq('exam_type', exam);
      }
      if (cat !== 'all') {
        prevQuery = prevQuery.eq('category', cat);
        nextQuery = nextQuery.eq('category', cat);
      }

      const [{ data: prevData }, { data: nextData }] = await Promise.all([
        prevQuery.limit(1).maybeSingle(),
        nextQuery.limit(1).maybeSingle()
      ]);

      setIsFirst(!prevData);
      setIsLast(!nextData);
      setNavIds({
        prev: prevData ? prevData.id : null,
        next: nextData ? nextData.id : null
      });
    }
    setLoading(false);
  }, [id, exam, cat, supabase]);

  useEffect(() => {
    fetchQuestionAndBoundaries();
  }, [fetchQuestionAndBoundaries]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    const targetId = direction === 'prev' ? navIds.prev : navIds.next;
    if (targetId) {
      router.push(`/practice/${targetId}?exam=${exam}&cat=${cat}`);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 animate-pulse">Loading Question...</div>;
  if (!question) return <div className="p-10 text-center font-bold">Question not found.</div>;

  return (
    <PracticeSessionUI 
      question={question}
      selectedOption={selectedOption}
      setSelectedOption={setSelectedOption}
      isSubmitted={isSubmitted}
      setIsSubmitted={setIsSubmitted}
      isFirst={isFirst}
      isLast={isLast}
      navigate={handleNavigate}
    />
  );
}