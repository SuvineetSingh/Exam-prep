import { dedupeEvents, formatEventText, FEED_DEDUPE_WINDOW_MS, type ActivityEventType } from '../feed';

const BASE = new Date('2026-07-14T12:00:00Z').getTime();

// Newest-first list, matching the feed query's order
function event(userId: string, eventType: ActivityEventType, minutesAgo: number) {
  return {
    user_id: userId,
    event_type: eventType,
    created_at: new Date(BASE - minutesAgo * 60_000).toISOString(),
  };
}

describe('dedupeEvents', () => {
  it('keeps everything when users and types are distinct', () => {
    const events = [event('a', 'room_joined', 0), event('b', 'room_joined', 1), event('a', 'quiz_completed', 2)];
    expect(dedupeEvents(events)).toHaveLength(3);
  });

  it('collapses repeats of the same user+type within the window', () => {
    const events = [
      event('a', 'room_joined', 0),
      event('a', 'room_joined', 10),
      event('a', 'room_joined', 59),
    ];
    expect(dedupeEvents(events)).toEqual([events[0]]);
  });

  it('a 20-event-per-hour power user surfaces once per event type', () => {
    const events = [
      ...Array.from({ length: 10 }, (_, i) => event('a', 'room_joined', i * 3)),
      ...Array.from({ length: 10 }, (_, i) => event('a', 'dm_started', 1 + i * 3)),
    ].sort((x, y) => y.created_at.localeCompare(x.created_at));
    const kept = dedupeEvents(events);
    expect(kept).toHaveLength(2);
    expect(new Set(kept.map((e) => e.event_type))).toEqual(new Set(['room_joined', 'dm_started']));
  });

  it('keeps one event per rolling window, not per calendar hour', () => {
    const events = [
      event('a', 'room_joined', 0),
      event('a', 'room_joined', 30), // suppressed: 30min after previous kept
      event('a', 'room_joined', 70), // kept: 70min before the first kept event
    ];
    expect(dedupeEvents(events)).toEqual([events[0], events[2]]);
  });

  it('keeps an event exactly one window apart', () => {
    const events = [event('a', 'room_joined', 0), event('a', 'room_joined', 60)];
    expect(dedupeEvents(events, FEED_DEDUPE_WINDOW_MS)).toHaveLength(2);
  });

  it('handles an empty list', () => {
    expect(dedupeEvents([])).toEqual([]);
  });
});

describe('formatEventText', () => {
  it('formats quiz completions with score, course, and mode', () => {
    expect(
      formatEventText({
        event_type: 'quiz_completed',
        metadata: { course: 'CMA', mode: 'practice', percentage: 80 },
      })
    ).toBe('just scored 80% on a CMA practice test');
    expect(
      formatEventText({
        event_type: 'quiz_completed',
        metadata: { course: 'CFA', mode: 'timed', percentage: 95 },
      })
    ).toBe('just scored 95% on a CFA timed exam');
  });

  it('falls back gracefully when quiz metadata is sparse', () => {
    expect(formatEventText({ event_type: 'quiz_completed', metadata: {} })).toBe(
      'just finished a practice test'
    );
  });

  it('formats room joins with and without a room name', () => {
    expect(
      formatEventText({ event_type: 'room_joined', metadata: { room_name: 'CMA Accounting' } })
    ).toBe('joined the CMA Accounting room');
    expect(formatEventText({ event_type: 'room_joined', metadata: {} })).toBe('joined a study room');
  });

  it('formats dm_started and study_session_started', () => {
    expect(formatEventText({ event_type: 'dm_started', metadata: {} })).toBe(
      'started a new conversation'
    );
    expect(formatEventText({ event_type: 'study_session_started', metadata: {} })).toBe(
      'started a study session'
    );
  });
});
