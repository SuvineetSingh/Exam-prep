import { createClient } from '@/lib/supabase/client';
import type { ActivityEventType } from '@/lib/activity/feed';

/**
 * Write an activity feed event. Best-effort by design: feed logging must
 * never break the user flow that triggered it, so failures are logged and
 * swallowed. (quiz_completed events are NOT written here — they come from a
 * DB trigger on exam_sessions; see migration 012.)
 */
export async function logActivityEvent(
  userId: string,
  eventType: Exclude<ActivityEventType, 'quiz_completed'>,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('activity_events')
      .insert({ user_id: userId, event_type: eventType, metadata });
    if (error) console.warn('Activity event write failed:', error.message);
  } catch (err) {
    console.warn('Activity event write failed:', err);
  }
}
