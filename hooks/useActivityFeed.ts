'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  FEED_DEDUPE_WINDOW_MS,
  type ActivityEventRow,
  type FeedEvent,
  type FeedResponse,
} from '@/lib/activity/feed';

/**
 * Activity feed data: initial page (and pagination) via /api/activity-feed,
 * live updates via a Realtime INSERT subscription on activity_events.
 */
export function useActivityFeed(currentUserId: string, limit = 10) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());

  // Active study partners stay visible to each other despite the feed opt-out
  // (same override the API applies server-side).
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('partner_status', 'active')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
      .then(({ data }) => {
        setPartnerIds(
          new Set(
            (data ?? []).map((p) => (p.requester_id === currentUserId ? p.addressee_id : p.requester_id))
          )
        );
      });
  }, [currentUserId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/activity-feed?limit=${limit}`)
      .then((r) => (r.ok ? r.json() : { events: [], nextCursor: null }))
      .then((body: FeedResponse) => {
        if (cancelled) return;
        setEvents(body.events);
        setNextCursor(body.nextCursor);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_events' },
        async (payload) => {
          const row = payload.new as ActivityEventRow;
          // The payload has no profile — fetch it, and apply the same
          // visibility rules as the API (opt-out, profileless users).
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username, full_name, avatar_url, country_code, is_bot, show_in_activity_feed')
            .eq('id', row.user_id)
            .single();
          if (!profile?.username) return;
          if (profile.show_in_activity_feed === false && !partnerIds.has(row.user_id)) return;

          const event: FeedEvent = {
            ...row,
            user: {
              username: profile.username,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              country_code: profile.country_code,
              is_bot: profile.is_bot,
            },
          };

          setEvents((prev) => {
            if (prev.some((e) => e.id === event.id)) return prev;
            // Same read-time dedupe as the API: don't stack repeats of the
            // same user+type within the rolling window.
            const isRepeat = prev.some(
              (e) =>
                e.user_id === event.user_id &&
                e.event_type === event.event_type &&
                new Date(event.created_at).getTime() - new Date(e.created_at).getTime() <
                  FEED_DEDUPE_WINDOW_MS
            );
            if (isRepeat) return prev;
            return [event, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [partnerIds]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/activity-feed?limit=${limit}&cursor=${encodeURIComponent(nextCursor)}`
      );
      if (!res.ok) return;
      const body: FeedResponse = await res.json();
      setEvents((prev) => [...prev, ...body.events.filter((e) => !prev.some((p) => p.id === e.id))]);
      setNextCursor(body.nextCursor);
    } catch {
      // best-effort; the user can retry
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, limit, loadingMore]);

  return { events, loading, loadingMore, nextCursor, loadMore };
}
