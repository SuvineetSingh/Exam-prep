/**
 * Phase 4 acceptance checks: study partner flow (migration 014) end to end
 * as real authenticated users, plus RLS and API authorization checks.
 * Run: set -a; source .env.local; set +a; node scripts/verify-study-partners.mjs
 *
 * Flow: alice & bob (accepted friends) → alice invites → bob accepts →
 * bob proposes session → alice confirms → alice starts (logs event) →
 * carol blocked from sessions + stats; feed opt-out override for partners.
 */

import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUB_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const APP = 'http://localhost:3000';
const PROJECT_REF = new globalThis.URL(URL).hostname.split('.')[0];

const service = createClient(URL, SECRET_KEY, { auth: { persistSession: false } });

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failures++;
}

function cookieFor(session) {
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

async function signIn(email) {
  const c = createClient(URL, PUB_KEY, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password: 'TestPass123!' });
  if (error) throw new Error(`sign-in ${email}: ${error.message}`);
  return { c, id: data.user.id, cookie: cookieFor(data.session) };
}

async function main() {
  const alice = await signIn('alice.test@examprep.dev');
  const bob = await signIn('bob.test@examprep.dev');
  const carol = await signIn('carol.test@examprep.dev');

  // Ensure a clean accepted friendship between alice & bob
  await service
    .from('friendships')
    .delete()
    .or(`and(requester_id.eq.${alice.id},addressee_id.eq.${bob.id}),and(requester_id.eq.${bob.id},addressee_id.eq.${alice.id})`);
  const { data: friendship } = await service
    .from('friendships')
    .insert({ requester_id: alice.id, addressee_id: bob.id, status: 'accepted' })
    .select('id')
    .single();
  const fid = friendship.id;
  let sessionId;

  try {
    // 1. alice (requester) sends partner invite — exercises the new update policy
    const { error: invErr } = await alice.c
      .from('friendships')
      .update({ partner_status: 'pending', partner_invited_by: alice.id })
      .eq('id', fid);
    let { data: row } = await service.from('friendships').select('partner_status, partner_invited_by').eq('id', fid).single();
    check('alice (requester) can send invite', !invErr && row.partner_status === 'pending' && row.partner_invited_by === alice.id, invErr?.message ?? JSON.stringify(row));

    // 2. bob accepts
    const { error: accErr } = await bob.c
      .from('friendships')
      .update({ partner_status: 'active', is_study_partner: true, partner_since: new Date().toISOString() })
      .eq('id', fid);
    ({ data: row } = await service.from('friendships').select('partner_status, is_study_partner').eq('id', fid).single());
    check('bob accepts → partnership active', !accErr && row.partner_status === 'active' && row.is_study_partner, accErr?.message ?? JSON.stringify(row));

    // 3. bob proposes a session
    const { data: session, error: propErr } = await bob.c
      .from('study_sessions')
      .insert({ friendship_id: fid, proposed_by: bob.id, scheduled_at: new Date(Date.now() + 86400000).toISOString() })
      .select('id, status')
      .single();
    check('bob proposes a study session', !propErr && session?.status === 'proposed', propErr?.message);
    sessionId = session?.id;

    // 4. alice confirms it
    const { error: confErr } = await alice.c.from('study_sessions').update({ status: 'confirmed' }).eq('id', sessionId);
    const { data: s1 } = await service.from('study_sessions').select('status').eq('id', sessionId).single();
    check('alice confirms the session', !confErr && s1.status === 'confirmed', confErr?.message ?? s1.status);

    // 5. alice starts it → study_session_started event + done
    await alice.c.from('study_sessions').update({ status: 'done' }).eq('id', sessionId);
    const { data: evt, error: evtErr } = await alice.c
      .from('activity_events')
      .insert({ user_id: alice.id, event_type: 'study_session_started', metadata: { friendship_id: fid, session_id: sessionId, partner_id: bob.id } })
      .select('id')
      .single();
    check('starting logs study_session_started event', !evtErr && !!evt, evtErr?.message);

    // 6. RLS: carol can't read or write their sessions
    const { data: carolRead } = await carol.c.from('study_sessions').select('id').eq('friendship_id', fid);
    check('carol (non-partner) cannot read sessions', (carolRead ?? []).length === 0, `saw ${carolRead?.length}`);
    const { error: carolWrite } = await carol.c
      .from('study_sessions')
      .insert({ friendship_id: fid, proposed_by: carol.id, scheduled_at: new Date().toISOString() });
    check('carol (non-partner) cannot insert sessions', !!carolWrite, 'insert unexpectedly succeeded');

    // 7. partner-stats API: alice can read bob's stats; carol gets 403
    const okRes = await fetch(`${APP}/api/partner-stats?userId=${bob.id}`, { headers: { cookie: alice.cookie } });
    const okBody = okRes.ok ? await okRes.json() : null;
    check('alice can fetch bob stats via API', okRes.status === 200 && okBody?.stats && 'study_streak' in okBody.stats, `status ${okRes.status}`);
    const denyRes = await fetch(`${APP}/api/partner-stats?userId=${bob.id}`, { headers: { cookie: carol.cookie } });
    check('carol denied bob stats via API (403)', denyRes.status === 403, `status ${denyRes.status}`);

    // 8. feed opt-out override: bob opts out, posts event — visible to alice, hidden from carol
    await service.from('user_profiles').update({ show_in_activity_feed: false }).eq('id', bob.id);
    const { data: bobEvt } = await service
      .from('activity_events')
      .insert({ user_id: bob.id, event_type: 'room_joined', metadata: { partner_vis_test: true } })
      .select('id')
      .single();
    const aliceFeed = await (await fetch(`${APP}/api/activity-feed?limit=50`, { headers: { cookie: alice.cookie } })).json();
    const carolFeed = await (await fetch(`${APP}/api/activity-feed?limit=50`, { headers: { cookie: carol.cookie } })).json();
    check('opted-out bob visible to partner alice', aliceFeed.events.some((e) => e.id === bobEvt.id));
    check('opted-out bob hidden from non-partner carol', !carolFeed.events.some((e) => e.id === bobEvt.id));
  } finally {
    // Cleanup: sessions cascade with the friendship; events + opt-out reset
    await service.from('activity_events').delete().eq('metadata->>partner_vis_test', 'true');
    await service.from('activity_events').delete().eq('metadata->>friendship_id', fid);
    await service.from('friendships').delete().eq('id', fid);
    await service.from('user_profiles').update({ show_in_activity_feed: true }).eq('id', bob.id);
  }

  console.log(failures === 0 ? '\n✅ All Phase 4 checks passed.' : `\n❌ ${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
