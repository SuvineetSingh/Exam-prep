import { createClient } from '@/lib/supabase/client';
import { computeLevel, XP_CORRECT, XP_WRONG, XP_EXAM_COMPLETE, XP_PERFECT_BONUS } from './constants';

export type XPSource = 'answer_correct' | 'answer_wrong' | 'exam_complete' | 'perfect_bonus';

export async function getUserXP(userId: string): Promise<{ totalXp: number; level: number } | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('user_xp')
    .select('total_xp, level')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return { totalXp: 0, level: 1 };
  return { totalXp: data.total_xp, level: data.level };
}

export async function awardXP(
  userId: string,
  source: XPSource,
  referenceId?: string
): Promise<number> {
  const supabase = createClient();
  const amount =
    source === 'answer_correct' ? XP_CORRECT :
    source === 'answer_wrong'   ? XP_WRONG :
    source === 'exam_complete'  ? XP_EXAM_COMPLETE :
    XP_PERFECT_BONUS;

  // Upsert user_xp row
  const { data: existing } = await supabase
    .from('user_xp')
    .select('total_xp')
    .eq('user_id', userId)
    .maybeSingle();

  const newTotal = (existing?.total_xp ?? 0) + amount;
  const newLevel = computeLevel(newTotal);

  await supabase.from('user_xp').upsert({
    user_id: userId,
    total_xp: newTotal,
    level: newLevel,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  // Log the transaction
  await supabase.from('xp_transactions').insert({
    user_id: userId,
    amount,
    source,
    reference_id: referenceId ?? null,
  });

  return amount;
}

export async function batchAwardXP(
  userId: string,
  transactions: { source: XPSource; referenceId?: string }[]
): Promise<number> {
  if (transactions.length === 0) return 0;
  const supabase = createClient();

  const totalAmount = transactions.reduce((sum, t) => {
    const amt =
      t.source === 'answer_correct' ? XP_CORRECT :
      t.source === 'answer_wrong'   ? XP_WRONG :
      t.source === 'exam_complete'  ? XP_EXAM_COMPLETE :
      XP_PERFECT_BONUS;
    return sum + amt;
  }, 0);

  const { data: existing } = await supabase
    .from('user_xp')
    .select('total_xp')
    .eq('user_id', userId)
    .maybeSingle();

  const newTotal = (existing?.total_xp ?? 0) + totalAmount;
  const newLevel = computeLevel(newTotal);

  await supabase.from('user_xp').upsert({
    user_id: userId,
    total_xp: newTotal,
    level: newLevel,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  const rows = transactions.map(t => ({
    user_id: userId,
    amount:
      t.source === 'answer_correct' ? XP_CORRECT :
      t.source === 'answer_wrong'   ? XP_WRONG :
      t.source === 'exam_complete'  ? XP_EXAM_COMPLETE :
      XP_PERFECT_BONUS,
    source: t.source,
    reference_id: t.referenceId ?? null,
  }));
  await supabase.from('xp_transactions').insert(rows);

  return totalAmount;
}
