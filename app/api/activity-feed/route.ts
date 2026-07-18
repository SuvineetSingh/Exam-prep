import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  dedupeEvents,
  type ActivityEventRow,
  type FeedEvent,
  type FeedResponse,
} from '@/lib/activity/feed';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;
// Overfetch so privacy filtering + dedupe can still fill a page.
const RAW_FACTOR = 4;

type FeedProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  country_code: string | null;
  is_bot: boolean;
  show_in_activity_feed: boolean;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const limit = Math.min(Math.max(parseInt(params.get('limit') ?? '', 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const cursor = params.get('cursor');

  const rawLimit = limit * RAW_FACTOR;
  let query = supabase
    .from('activity_events')
    .select('id, user_id, event_type, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(rawLimit);
  if (cursor) query = query.lt('created_at', cursor);

  // Active study partners see each other's events even when opted out of the
  // general feed (accepting the partnership opts you in for your partner).
  // The caller's RLS only exposes their own friendship rows.
  const [{ data: rows, error }, { data: partnerships }] = await Promise.all([
    query,
    supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('partner_status', 'active')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
  ]);
  if (error) {
    console.error('Activity feed query failed:', error.message);
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 });
  }
  const events = (rows ?? []) as ActivityEventRow[];
  const partnerIds = new Set(
    (partnerships ?? []).map((p) => (p.requester_id === user.id ? p.addressee_id : p.requester_id))
  );

  // activity_events FKs to auth.users, not user_profiles, so PostgREST can't
  // embed the profile — fetch profiles separately and merge.
  const profileById = new Map<string, FeedProfileRow>();
  const userIds = [...new Set(events.map((e) => e.user_id))];
  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, username, full_name, avatar_url, country_code, is_bot, show_in_activity_feed')
      .in('id', userIds);
    if (profileError) {
      console.error('Activity feed profile query failed:', profileError.message);
      return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 });
    }
    for (const profile of (profiles ?? []) as FeedProfileRow[]) {
      profileById.set(profile.id, profile);
    }
  }

  // Opted-out users and users without a visible profile never appear —
  // except to their active study partners.
  const visible = events.filter((event) => {
    const profile = profileById.get(event.user_id);
    if (!profile?.username) return false;
    return profile.show_in_activity_feed !== false || partnerIds.has(event.user_id);
  });

  const deduped = dedupeEvents(visible);
  const page = deduped.slice(0, limit);

  const feedEvents: FeedEvent[] = page.map((event) => {
    const profile = profileById.get(event.user_id)!;
    return {
      ...event,
      user: {
        username: profile.username!,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        country_code: profile.country_code,
        is_bot: profile.is_bot,
      },
    };
  });

  // Filtering/dedupe can suppress rows mid-batch, so resume from the last row
  // this page consumed: the last returned event if the page filled, otherwise
  // the end of the raw batch (null once the raw fetch came back short).
  let nextCursor: string | null = null;
  if (deduped.length > limit) {
    nextCursor = page.at(-1)?.created_at ?? null;
  } else if (events.length === rawLimit) {
    nextCursor = events.at(-1)?.created_at ?? null;
  }

  const body: FeedResponse = { events: feedEvents, nextCursor };
  return NextResponse.json(body);
}
