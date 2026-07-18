/**
 * Phase 1 acceptance checks for GET /api/activity-feed (dev server on :3000).
 * Run: set -a; source .env.local; set +a; node scripts/verify-feed-api.mjs
 *
 * Seeds via service role: alice as a "power user" (10 room_joined + 10
 * dm_started within the last 30 min), carol opted out of the feed with 3
 * events, bob with 1. Then calls the API as alice and checks:
 *   1. 401 without auth
 *   2. correctly shaped JSON (events[] with user object, nextCursor)
 *   3. opted-out carol never appears
 *   4. power-user alice surfaces at most once per event type
 *   5. cursor pagination advances without repeating events
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUB_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const APP = 'http://localhost:3000';
const PROJECT_REF = new globalThis.URL(URL).hostname.split('.')[0];

const service = createClient(URL, SECRET_KEY, { auth: { persistSession: false } });
const runId = randomUUID();

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failures++;
}

// @supabase/ssr cookie format: base64url-encoded session with "base64-"
// prefix, chunked at ~3180 chars into name.0, name.1, ...
function sessionCookieHeader(session) {
  const name = `sb-${PROJECT_REF}-auth-token`;
  const value = 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url');
  const MAX = 3180;
  if (value.length <= MAX) return `${name}=${value}`;
  const parts = [];
  for (let i = 0; i * MAX < value.length; i++) {
    parts.push(`${name}.${i}=${value.slice(i * MAX, (i + 1) * MAX)}`);
  }
  return parts.join('; ');
}

async function userIdByUsername(username) {
  const { data, error } = await service.from('user_profiles').select('id').eq('username', username).single();
  if (error) throw new Error(`lookup ${username}: ${error.message}`);
  return data.id;
}

async function main() {
  const [aliceId, bobId, carolId] = await Promise.all(
    ['alice_cma', 'bob_cfa', 'carol_fe'].map(userIdByUsername)
  );

  const now = Date.now();
  const seed = [];
  for (let i = 0; i < 10; i++) {
    seed.push({ user_id: aliceId, event_type: 'room_joined', metadata: { run_id: runId }, created_at: new Date(now - i * 60_000).toISOString() });
    seed.push({ user_id: aliceId, event_type: 'dm_started', metadata: { run_id: runId }, created_at: new Date(now - (i * 60_000 + 30_000)).toISOString() });
  }
  for (let i = 0; i < 3; i++) {
    seed.push({ user_id: carolId, event_type: 'room_joined', metadata: { run_id: runId }, created_at: new Date(now - i * 60_000).toISOString() });
  }
  seed.push({ user_id: bobId, event_type: 'room_joined', metadata: { run_id: runId }, created_at: new Date(now - 120_000).toISOString() });

  try {
    const { error: seedErr } = await service.from('activity_events').insert(seed);
    if (seedErr) throw new Error(`seed failed: ${seedErr.message}`);
    const { error: optErr } = await service.from('user_profiles').update({ show_in_activity_feed: false }).eq('id', carolId);
    if (optErr) throw new Error(`opt-out failed: ${optErr.message}`);

    // 1. Unauthenticated → 401
    const anonRes = await fetch(`${APP}/api/activity-feed`);
    check('unauthenticated request gets 401', anonRes.status === 401, `got ${anonRes.status}`);

    // Sign in as alice, build the SSR auth cookie
    const authClient = createClient(URL, PUB_KEY, { auth: { persistSession: false } });
    const { data: auth, error: authErr } = await authClient.auth.signInWithPassword({
      email: 'alice.test@examprep.dev',
      password: 'TestPass123!',
    });
    if (authErr) throw new Error(`sign-in failed: ${authErr.message}`);
    const cookie = sessionCookieHeader(auth.session);

    const res = await fetch(`${APP}/api/activity-feed?limit=50`, { headers: { cookie } });
    check('authenticated request gets 200', res.status === 200, `got ${res.status}`);
    const body = await res.json();

    // 2. Shape
    const shaped =
      Array.isArray(body.events) &&
      'nextCursor' in body &&
      body.events.every(
        (e) => e.id && e.user_id && e.event_type && e.created_at && e.user && typeof e.user.username === 'string'
      );
    check('response shape (events[] with user, nextCursor)', shaped, JSON.stringify(body).slice(0, 200));

    // 3. Opted-out carol absent
    check('opted-out user never appears', !body.events.some((e) => e.user_id === carolId));

    // 4. Power-user dedupe: alice at most once per event type. Scoped to the
    // seeded window (last hour) — older alice events from other test data are
    // legitimately one-per-rolling-hour and would inflate a global count.
    const withinSeedWindow = (e) => Date.now() - new Date(e.created_at).getTime() < 60 * 60 * 1000;
    const aliceRoom = body.events.filter((e) => e.user_id === aliceId && e.event_type === 'room_joined' && withinSeedWindow(e)).length;
    const aliceDM = body.events.filter((e) => e.user_id === aliceId && e.event_type === 'dm_started' && withinSeedWindow(e)).length;
    check('power user capped at one room_joined', aliceRoom === 1, `got ${aliceRoom}`);
    check('power user capped at one dm_started', aliceDM === 1, `got ${aliceDM}`);
    check('other users still present (bob)', body.events.some((e) => e.user_id === bobId));

    // 5. Pagination
    const p1 = await (await fetch(`${APP}/api/activity-feed?limit=1`, { headers: { cookie } })).json();
    check('page 1 returns one event with a cursor', p1.events.length === 1 && !!p1.nextCursor);
    if (p1.nextCursor) {
      const p2 = await (
        await fetch(`${APP}/api/activity-feed?limit=1&cursor=${encodeURIComponent(p1.nextCursor)}`, { headers: { cookie } })
      ).json();
      check(
        'page 2 advances past page 1',
        p2.events.length === 1 && p2.events[0].id !== p1.events[0].id,
        JSON.stringify(p2).slice(0, 120)
      );
    }
  } finally {
    await service.from('activity_events').delete().eq('metadata->>run_id', runId);
    await service.from('user_profiles').update({ show_in_activity_feed: true }).eq('id', carolId);
  }

  console.log(failures === 0 ? '\n✅ All Phase 1 checks passed.' : `\n❌ ${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
