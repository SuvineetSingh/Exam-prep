import { createClient } from '@/lib/supabase/client';
import type { LobbyUserProfile } from '@/lib/types/lobby';

/** Tags for one user, in the order they were added. Missing/errored → []. */
export async function fetchUserTags(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_tags')
    .select('tag')
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (error || !data) return [];
  return data.map((row) => row.tag as string);
}

/** Popularity-ranked tag suggestions for autocomplete. Empty prefix → no suggestions. */
export async function fetchTagSuggestions(prefix: string, limit = 8): Promise<string[]> {
  const term = prefix.trim();
  if (term.length < 2) return [];

  const supabase = createClient();
  const { data, error } = await supabase.rpc('suggest_tags', { p_prefix: term, p_limit: limit });

  if (error || !data) return [];
  return (data as { tag: string; usage_count: number }[]).map((row) => row.tag);
}

/**
 * The only function anywhere in the app that writes to user_tags. Updates
 * profile fields and replaces the user's 5 tags atomically via the
 * save_profile_and_tags DB function (see 031_user_tags.sql) — pass
 * `updates: {}` for a tags-only save.
 */
export async function saveProfileAndTags(
  userId: string,
  updates: Partial<LobbyUserProfile>,
  tags: string[]
): Promise<void> {
  const seen = new Set<string>();
  const cleaned = tags
    .map((t) => t.trim())
    .filter((t) => {
      if (!t) return false;
      const key = t.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (cleaned.length !== 5) {
    throw new Error('Add exactly 5 tags.');
  }

  const supabase = createClient();
  const { error } = await supabase.rpc('save_profile_and_tags', {
    p_user_id: userId,
    p_updates: updates,
    p_tags: cleaned,
  });

  if (error) throw error;
}
