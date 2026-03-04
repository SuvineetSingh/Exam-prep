import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchDMMessages } from '@/lib/supabase/queries/lobbyQueries';
import type { LobbyMessage } from '@/lib/types/lobby';

export function useDMMessages(userId: string | null, partnerId: string | null) {
  const [messages, setMessages] = useState<LobbyMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const partnerRef = useRef(partnerId);

  partnerRef.current = partnerId;

  useEffect(() => {
    if (!userId || !partnerId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    fetchDMMessages(userId, partnerId)
      .then((data) => {
        if (partnerRef.current === partnerId) {
          setMessages(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, partnerId]);

  useEffect(() => {
    if (!userId || !partnerId) return;

    const supabase = createClient();
    const sortedIds = [userId, partnerId].sort().join('-');
    const channel = supabase
      .channel(`dm:${sortedIds}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_messages',
          filter: `message_type=eq.dm`,
        },
        async (payload) => {
          const newMsg = payload.new as { id: string; sender_id: string; recipient_id: string };
          const isRelevant =
            (newMsg.sender_id === userId && newMsg.recipient_id === partnerId) ||
            (newMsg.sender_id === partnerId && newMsg.recipient_id === userId);

          if (!isRelevant) return;

          const { data } = await supabase
            .from('lobby_messages')
            .select('*, sender:user_profiles!sender_id(username, avatar_url, is_bot, exam_type, industry)')
            .eq('id', newMsg.id)
            .single();

          if (data && partnerRef.current === partnerId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.id)) return prev;
              return [...prev, data as LobbyMessage];
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, partnerId]);

  const sendDM = useCallback(
    async (content: string) => {
      if (!userId || !partnerId) return;
      const supabase = createClient();
      await supabase.from('lobby_messages').insert({
        sender_id: userId,
        recipient_id: partnerId,
        content,
        message_type: 'dm',
      });
    },
    [userId, partnerId]
  );

  return { messages, loading, sendDM };
}
