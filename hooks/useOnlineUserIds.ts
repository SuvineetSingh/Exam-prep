'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Lobby-wide presence for Facebook-style green dots on avatars. Every lobby
 * visitor tracks themselves on one shared channel; the returned set holds the
 * user ids currently online. Bots always count as online (consistent with the
 * scripted-activity strategy).
 */
export function useOnlineUserIds(currentUser: { id: string } | null): Set<string> {
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [botIds, setBotIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('user_profiles')
      .select('id')
      .eq('is_bot', true)
      .then(({ data }) => setBotIds(new Set((data ?? []).map((b) => b.id))));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const supabase = createClient();
    const channel = supabase.channel('lobby:online', {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        // Presence keys are user ids
        setPresentIds(new Set(Object.keys(channel.presenceState())));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return useMemo(() => new Set([...presentIds, ...botIds]), [presentIds, botIds]);
}
