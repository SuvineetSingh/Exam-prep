'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PracticeSessionUI } from '@/components/practice/PracticeSessionUI';
import type { QuestionLog } from '@/components/practice/PracticeSessionUI';

export default function SingleQuestionPractice() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const exam        = searchParams.get('exam')    || 'all';
  const cat         = searchParams.get('cat')     || 'all';
  const sessionId   = searchParams.get('session') || '';
  const starredMode = searchParams.get('starred') === 'true';

  const [question, setQuestion]             = useState<any>(null);
  const [loading, setLoading]               = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted]       = useState(false);
  const [isFirst, setIsFirst]               = useState(false);
  const [isLast, setIsLast]                 = useState(false);
  const [navIds, setNavIds]                 = useState<{ prev: number | null; next: number | null }>({
    prev: null,
    next: null,
  });
  const [starredIds, setStarredIds]         = useState<number[]>([]);
  const [questionNumber, setQuestionNumber] = useState(1);

  // ── SESSION LOG ────────────────────────────────────────────────────────────
  // Root cause of the bug: PracticeSessionUI kept the log in its own state,
  // but every Next.js navigation (/practice/[id]) unmounts + remounts the
  // component, wiping the array back to [].
  //
  // Fix: lift the log up to THIS page and persist it in sessionStorage keyed
  // by sessionId. On every mount we read from sessionStorage, so the full
  // history survives across question navigations.
  const storageKey = sessionId ? `practice_log_${sessionId}` : null;

  const [sessionLog, setSessionLog] = useState<QuestionLog[]>(() => {
    if (typeof window === 'undefined' || !storageKey) return [];
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as QuestionLog[]) : [];
    } catch {
      return [];
    }
  });

  // Mirror every update back to sessionStorage
  useEffect(() => {
    if (!storageKey) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(sessionLog));
    } catch {
      // sessionStorage full or unavailable — fail silently
    }
  }, [sessionLog, storageKey]);

  // Load starred IDs from sessionStorage when in starred mode
  useEffect(() => {
    if (!starredMode || !sessionId) return;
    try {
      const raw = sessionStorage.getItem(`starred_ids_${sessionId}`);
      if (raw) setStarredIds(JSON.parse(raw) as number[]);
    } catch {}
  }, [starredMode, sessionId]);

  // ── FETCH QUESTION + NEIGHBOURS ───────────────────────────────────────────
  const fetchQuestionAndBoundaries = useCallback(async () => {
    setLoading(true);
    const currentId = Number(id);

    let questionQuery = supabase
      .from('questions')
      .select('*')
      .eq('id', currentId);
    if (!starredMode && exam !== 'all') {
      questionQuery = questionQuery.eq('exam_type', exam);
    }
    const { data } = await questionQuery.maybeSingle();

    if (data) {
      setQuestion(data);
      setIsSubmitted(false);
      setSelectedOption(null);

      if (starredMode) {
        // Navigation within the ordered starred IDs list
        let ids = starredIds;
        if (ids.length === 0) {
          // Try reading from sessionStorage as a fallback (first render race)
          try {
            const raw = sessionStorage.getItem(`starred_ids_${sessionId}`);
            if (raw) ids = JSON.parse(raw) as number[];
          } catch {}
        }
        const idx = ids.indexOf(currentId);
        setIsFirst(idx <= 0);
        setIsLast(idx >= ids.length - 1 || idx === -1);
        setNavIds({
          prev: idx > 0 ? (ids[idx - 1] ?? null) : null,
          next: idx >= 0 && idx < ids.length - 1 ? (ids[idx + 1] ?? null) : null,
        });
        if (idx >= 0) setQuestionNumber(idx + 1);
      } else {
        let prevQuery = supabase
          .from('questions')
          .select('id')
          .lt('id', currentId)
          .order('id', { ascending: false });
        let nextQuery = supabase
          .from('questions')
          .select('id')
          .gt('id', currentId)
          .order('id', { ascending: true });

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
          nextQuery.limit(1).maybeSingle(),
        ]);

        setIsFirst(!prevData);
        setIsLast(!nextData);
        setNavIds({ prev: prevData ? prevData.id : null, next: nextData ? nextData.id : null });
      }
    }
    setLoading(false);
  }, [id, exam, cat, starredMode, starredIds]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchQuestionAndBoundaries();
  }, [fetchQuestionAndBoundaries]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    const targetId = direction === 'prev' ? navIds.prev : navIds.next;
    if (targetId) {
      if (!starredMode) {
        setQuestionNumber(n => direction === 'next' ? n + 1 : Math.max(1, n - 1));
      }
      const params = starredMode
        ? `session=${sessionId}&starred=true`
        : `exam=${exam}&cat=${cat}&session=${sessionId}`;
      router.push(`/practice/${targetId}?${params}`);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-neutral-400 animate-pulse">
        Loading Question...
      </div>
    );
  if (!question)
    return <div className="p-10 text-center font-bold">Question not found.</div>;

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
      sessionId={sessionId}
      examFilter={exam}
      categoryFilter={cat}
      sessionLog={sessionLog}
      onLogUpdate={setSessionLog}
      questionNumber={questionNumber}
      totalQuestions={starredMode ? starredIds.length || undefined : undefined}
    />
  );
}