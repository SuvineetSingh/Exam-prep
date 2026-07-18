import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { QuestionViewClient } from './QuestionViewClient';

export default async function FullQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

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
  let questionNumber: number | null = null;
  const totalQuestions = allQuestions?.length ?? null;

  if (allQuestions) {
    const currentIndex = allQuestions.findIndex(q => q.id === parseInt(id));
    // Question Bank list numbers questions by id descending — mirror that here
    // so the same question shows the same number in both views. Navigation
    // must follow that same descending order: "Next" moves to the next list
    // number (lower array index), "Previous" to the one before it.
    questionNumber = currentIndex >= 0 ? allQuestions.length - currentIndex : null;
    if (currentIndex < allQuestions.length - 1) prevId = allQuestions[currentIndex + 1]?.id ?? null;
    if (currentIndex > 0) nextId = allQuestions[currentIndex - 1]?.id ?? null;
  }

  return (
    <AppShell user={user}>
      <QuestionViewClient
        question={question}
        prevId={prevId}
        nextId={nextId}
        questionNumber={questionNumber ?? undefined}
        totalQuestions={totalQuestions ?? undefined}
      />
    </AppShell>
  );
}