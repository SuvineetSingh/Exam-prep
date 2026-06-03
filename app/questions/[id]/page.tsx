import { createClient } from '@/lib/supabase/server';
import { QuestionDisplay } from '@/components/question/QuestionDisplay';
import { QuestionNavigation } from '@/components/question/QuestionNavigation';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';

// 1. Update the type definition for params to be a Promise
export default async function FullQuestionPage({ 
    params 
  }: { 
    params: Promise<{ id: string }> 
  }) {
    // 2. Await the params before using them
    const { id } = await params; 
    
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    
    // 3. Use the unwrapped 'id' variable in your query
    const { data: question, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();
  
    if (error || !question) notFound();

    const { data: allQuestions } = await supabase
      .from('questions')
      .select('id')
      .order('id', { ascending: true });

    let prevId: number | null = null;
    let nextId: number | null = null;

    if (allQuestions) {
      const currentIndex = allQuestions.findIndex(q => q.id === parseInt(id));
      if (currentIndex > 0) {
        prevId = allQuestions[currentIndex - 1]?.id ?? null;
      }
      if (currentIndex < allQuestions.length - 1) {
        nextId = allQuestions[currentIndex + 1]?.id ?? null;
      }
    }

    return (
      <AppShell user={user}>
        <QuestionDisplay question={question} mode="practice" />
        <QuestionNavigation prevId={prevId} nextId={nextId} />
      </AppShell>
    );
  }