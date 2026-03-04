import { createClient } from '@/lib/supabase/server';
import { QuestionDisplay } from '@/components/question/QuestionDisplay';
import { QuestionNavigation } from '@/components/question/QuestionNavigation';
import { notFound, redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';

// 1. Update the type definition for params to be a Promise
export default async function FullQuestionPage({ 
    params 
  }: { 
    params: Promise<{ id: string }> 
  }) {
    // 2. Await the params before using them
    const { id } = await params; 
    
    const supabase = await createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) redirect('/login');
    
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header user={session.user} />
        <main className="flex-1 max-w-4xl mx-auto w-full p-6 pt-32">
          <QuestionDisplay question={question} mode="practice" />
          <QuestionNavigation prevId={prevId} nextId={nextId} />
        </main>
      </div>
    );
  }