/**
 * Phase 0 acceptance checks for the activity feed schema (migrations 012/013).
 * Run: set -a; source .env.local; set +a; node scripts/verify-activity-feed.mjs
 *
 * Uses the seeded test users from seed-test-users.mjs (alice + bob) to verify
 * as real authenticated clients:
 *   1. quiz_completed trigger fires exactly once on exam_sessions insert
 *   2. re-upserting the same session doesn't duplicate the event
 *   3. deleting the session removes the event (retry-path cleanup)
 *   4. RLS: any authenticated user can read the feed
 *   5. RLS: users cannot insert events for other users
 *   6. Realtime: activity_events INSERTs are delivered to subscribers
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUB_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
if (!URL || !PUB_KEY || !SECRET_KEY) {
  console.error('Missing env. Run: set -a; source .env.local; set +a; node scripts/verify-activity-feed.mjs');
  process.exit(1);
}

const service = createClient(URL, SECRET_KEY, { auth: { persistSession: false } });

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failures++;
}

async function signIn(email) {
  const client = createClient(URL, PUB_KEY, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password: 'TestPass123!' });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  // Bare Node clients don't forward the user JWT to the realtime socket on
  // sign-in (the app's browser client does); without this, RLS-checked
  // postgres_changes silently deliver nothing.
  await client.realtime.setAuth(data.session.access_token);
  return { client, userId: data.user.id };
}

async function eventsForSession(sessionId) {
  const { data, error } = await service
    .from('activity_events')
    .select('*')
    .eq('event_type', 'quiz_completed')
    .eq('metadata->>session_id', sessionId);
  if (error) throw error;
  return data;
}

async function main() {
  const alice = await signIn('alice.test@examprep.dev');
  const bob = await signIn('bob.test@examprep.dev');
  const sessionId = randomUUID();
  const cleanupEventIds = [];

  try {
    // 1. Trigger fires once on insert (same shape as PracticeSessionUI's insert)
    const sessionRow = {
      id: sessionId,
      user_id: alice.userId,
      exam_type: 'CMA',
      mode: 'practice',
      total_questions: 10,
      score: 8,
      percentage: 80,
      time_taken_seconds: 300,
      answered_count: 10,
      unanswered_count: 0,
    };
    const { error: insErr } = await alice.client.from('exam_sessions').insert(sessionRow);
    check('exam_sessions insert as alice', !insErr, insErr?.message);

    let events = await eventsForSession(sessionId);
    check('trigger wrote exactly one quiz_completed event', events.length === 1, `got ${events.length}`);
    if (events[0]) {
      const m = events[0].metadata;
      check(
        'event metadata correct',
        events[0].user_id === alice.userId && m.course === 'CMA' && m.mode === 'practice' && m.score === 8 && m.percentage === 80,
        JSON.stringify(m)
      );
    }

    // 2. Re-upsert (timed-exam retry path) must not duplicate
    const { error: upsertErr } = await alice.client.from('exam_sessions').upsert({ ...sessionRow, score: 9, percentage: 90 });
    check('exam_sessions re-upsert as alice', !upsertErr, upsertErr?.message);
    events = await eventsForSession(sessionId);
    check('still exactly one event after re-upsert', events.length === 1, `got ${events.length}`);

    // 4. RLS read: bob (different user) can see alice's event
    const { data: bobRead, error: bobReadErr } = await bob.client
      .from('activity_events')
      .select('id')
      .eq('event_type', 'quiz_completed')
      .eq('metadata->>session_id', sessionId);
    check('bob can read alice\'s event (semi-public feed)', !bobReadErr && bobRead?.length === 1, bobReadErr?.message);

    // 5. RLS insert: bob cannot write an event as alice
    const { error: spoofErr } = await bob.client
      .from('activity_events')
      .insert({ user_id: alice.userId, event_type: 'room_joined', metadata: {} });
    check('bob blocked from inserting event as alice', !!spoofErr, 'insert unexpectedly succeeded');

    // bob CAN write his own (app-code path for room_joined)
    const { data: bobEvent, error: bobInsErr } = await bob.client
      .from('activity_events')
      .insert({ user_id: bob.userId, event_type: 'room_joined', metadata: { verify: true } })
      .select('id')
      .single();
    check('bob can insert his own room_joined event', !bobInsErr, bobInsErr?.message);
    if (bobEvent) cleanupEventIds.push(bobEvent.id);

    // 6. Realtime delivery (also proves the publication includes the table)
    const rtResult = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve('timeout'), 10000);
      const channel = alice.client
        .channel('verify-activity-feed')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_events' }, (payload) => {
          if (payload.new?.metadata?.rt_probe) {
            clearTimeout(timer);
            resolve('received');
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            const { data } = await alice.client
              .from('activity_events')
              .insert({ user_id: alice.userId, event_type: 'room_joined', metadata: { rt_probe: true } })
              .select('id')
              .single();
            if (data) cleanupEventIds.push(data.id);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timer);
            resolve(status);
          }
        });
    });
    await alice.client.removeAllChannels();
    check('realtime INSERT delivered to subscriber', rtResult === 'received', String(rtResult));

    // 3. Deleting the session removes the event (retry-path cleanup trigger)
    const { error: delErr } = await alice.client.from('exam_sessions').delete().eq('id', sessionId);
    check('exam_sessions delete as alice', !delErr, delErr?.message);
    events = await eventsForSession(sessionId);
    check('event removed after session delete', events.length === 0, `got ${events.length}`);
  } finally {
    // Clean up everything this run created (service role — no user delete policy by design)
    await service.from('exam_sessions').delete().eq('id', sessionId);
    if (cleanupEventIds.length) await service.from('activity_events').delete().in('id', cleanupEventIds);
    await service.from('activity_events').delete().eq('metadata->>session_id', sessionId);
  }

  console.log(failures === 0 ? '\n✅ All Phase 0 checks passed.' : `\n❌ ${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
