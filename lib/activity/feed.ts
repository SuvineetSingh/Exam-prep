export type ActivityEventType =
  | 'quiz_completed'
  | 'room_joined'
  | 'dm_started'
  | 'study_session_started';

export interface ActivityEventRow {
  id: string;
  user_id: string;
  event_type: ActivityEventType;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface FeedUser {
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  country_code: string | null;
  is_bot: boolean;
}

export interface FeedEvent extends ActivityEventRow {
  user: FeedUser;
}

export interface FeedResponse {
  events: FeedEvent[];
  nextCursor: string | null;
}

export const FEED_DEDUPE_WINDOW_MS = 60 * 60 * 1000;

/**
 * Feed row copy. Deliberately past-tense: quiz events fire on completion and
 * there is no session-start signal for practice, so "is studying right now"
 * would be a lie.
 */
export function formatEventText(event: Pick<ActivityEventRow, 'event_type' | 'metadata'>): string {
  const m = event.metadata ?? {};
  switch (event.event_type) {
    case 'quiz_completed': {
      const kind = m.mode === 'timed' ? 'timed exam' : 'practice test';
      const course = typeof m.course === 'string' ? `${m.course} ` : '';
      if (typeof m.percentage === 'number') {
        return `just scored ${m.percentage}% on a ${course}${kind}`;
      }
      return `just finished a ${course}${kind}`;
    }
    case 'room_joined':
      return typeof m.room_name === 'string' ? `joined the ${m.room_name} room` : 'joined a study room';
    case 'dm_started':
      return 'started a new conversation';
    case 'study_session_started':
      return 'started a study session';
    default:
      return 'was active';
  }
}

/**
 * Collapse a user's repeated events so one power user can't flood the feed:
 * at most one event per user+type per rolling window. Input must be sorted
 * newest-first (the feed query's order); an event is kept only if the
 * previously kept event for the same user+type is at least `windowMs` newer.
 */
export function dedupeEvents<T extends Pick<ActivityEventRow, 'user_id' | 'event_type' | 'created_at'>>(
  events: T[],
  windowMs: number = FEED_DEDUPE_WINDOW_MS
): T[] {
  const lastKeptAt = new Map<string, number>();
  const kept: T[] = [];
  for (const event of events) {
    const key = `${event.user_id}:${event.event_type}`;
    const time = new Date(event.created_at).getTime();
    const prev = lastKeptAt.get(key);
    if (prev === undefined || prev - time >= windowMs) {
      lastKeptAt.set(key, time);
      kept.push(event);
    }
  }
  return kept;
}
