import { createClient } from '@/lib/supabase/client';

export async function fetchStarredIds(userId: string): Promise<number[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('starred_questions')
    .select('question_id')
    .eq('user_id', userId);
  return (data ?? []).map((r) => Number(r.question_id));
}

export async function isQuestionStarred(userId: string, questionId: number): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('starred_questions')
    .select('question_id')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();
  return !!data;
}

export async function starQuestion(userId: string, questionId: number, examType: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from('starred_questions')
    .insert({ user_id: userId, question_id: questionId, exam_type: examType });
}

export async function unstarQuestion(userId: string, questionId: number): Promise<void> {
  const supabase = createClient();
  await supabase
    .from('starred_questions')
    .delete()
    .eq('user_id', userId)
    .eq('question_id', questionId);
}

export async function toggleStar(
  userId: string,
  questionId: number,
  examType: string,
  currentlyStarred: boolean
): Promise<void> {
  if (currentlyStarred) {
    await unstarQuestion(userId, questionId);
  } else {
    await starQuestion(userId, questionId, examType);
  }
}
