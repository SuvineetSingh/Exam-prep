import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchRoomMessages } from '@/lib/supabase/queries/lobbyQueries';
import type { LobbyMessage } from '@/lib/types/lobby';

export function useLobbyMessages(roomId: string | null) {
  const [messages, setMessages] = useState<LobbyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const roomIdRef = useRef(roomId);

  roomIdRef.current = roomId;

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchRoomMessages(roomId)
      .then((data) => {
        if (roomIdRef.current === roomId) {
          setMessages(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`room-messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('lobby_messages')
            .select('*, sender:user_profiles!sender_id(username, avatar_url, is_bot, exam_type, industry)')
            .eq('id', payload.new.id)
            .single();

          if (data && roomIdRef.current === roomId) {
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
  }, [roomId]);

  const sendMessage = useCallback(
    async (content: string, senderId: string) => {
      if (!roomId) return;
      const supabase = createClient();
      await supabase.from('lobby_messages').insert({
        room_id: roomId,
        sender_id: senderId,
        content,
        message_type: 'room',
      });
    },
    [roomId]
  );

  return { messages, loading, sendMessage };
}
