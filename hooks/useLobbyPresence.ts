import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { OnlineUser } from '@/lib/types/lobby';

interface PresenceUser {
  id: string;
  username: string;
  exam_type?: string;
  avatar_url?: string;
  is_bot?: boolean;
  online_at: string;
}

export function useLobbyPresence(
  roomSlug: string,
  currentUser: { id: string; username: string; exam_type?: string; avatar_url?: string } | null
) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [bots, setBots] = useState<OnlineUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from('user_profiles')
      .select('id, username, exam_type, avatar_url')
      .eq('is_bot', true)
      .then(({ data }) => {
        if (data) {
          setBots(
            data.map((bot) => ({
              id: bot.id,
              username: bot.username || 'Bot',
              exam_type: bot.exam_type || undefined,
              avatar_url: bot.avatar_url || undefined,
              is_bot: true,
              online_at: new Date().toISOString(),
            }))
          );
        }
      });
  }, []);

  useEffect(() => {
    if (!currentUser || !roomSlug) return;

    const supabase = createClient();
    const channel = supabase.channel(`room:${roomSlug}`, {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users: OnlineUser[] = [];
        for (const presences of Object.values(state)) {
          const p = presences[0];
          if (p) {
            users.push({
              id: p.id,
              username: p.username,
              exam_type: p.exam_type,
              avatar_url: p.avatar_url,
              is_bot: p.is_bot,
              online_at: p.online_at,
            });
          }
        }
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: currentUser.id,
            username: currentUser.username,
            exam_type: currentUser.exam_type,
            avatar_url: currentUser.avatar_url,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomSlug, currentUser?.id]);

  const allUsers = [...onlineUsers, ...bots.filter((bot) => !onlineUsers.some((u) => u.id === bot.id))];

  return allUsers;
}
