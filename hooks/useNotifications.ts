import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { NotificationToast, UnreadCounts } from '@/lib/types/lobby';

const MAX_TOASTS = 3;
const TOAST_DURATION = 5000; // 5 seconds

export function useNotifications(userId: string) {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({ rooms: {}, dms: {} });
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  // Track which conversations were already read at mount so we don't
  // trigger false unreads for historical messages.
  const lastReadAtRef = useRef<Record<string, string>>({});

  // Load persisted read timestamps from Supabase on mount
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from('conversation_reads')
      .select('conversation_id, conversation_type, last_read_at')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        for (const row of data) {
          map[`${row.conversation_type}:${row.conversation_id}`] = row.last_read_at;
        }
        lastReadAtRef.current = map;
        // Unread counts start at 0 — messages after last_read_at will
        // be counted by Realtime listeners as they arrive.
      });
  }, [userId]);

  // Persist a "read" timestamp to Supabase
  const persistRead = useCallback(
    async (type: 'room' | 'dm', id: string) => {
      const supabase = createClient();
      const now = new Date().toISOString();
      lastReadAtRef.current[`${type}:${id}`] = now;
      await supabase.from('conversation_reads').upsert(
        {
          user_id: userId,
          conversation_id: id,
          conversation_type: type,
          last_read_at: now,
        },
        { onConflict: 'user_id,conversation_id,conversation_type' }
      );
    },
    [userId]
  );

  // Increment unread count — skip if message predates our last read
  const incrementUnread = useCallback(
    (type: 'room' | 'dm', id: string, messageTimestamp?: string) => {
      if (messageTimestamp) {
        const lastRead = lastReadAtRef.current[`${type}:${id}`];
        if (lastRead && messageTimestamp <= lastRead) return;
      }
      setUnreadCounts((prev) => ({
        ...prev,
        [type === 'room' ? 'rooms' : 'dms']: {
          ...(type === 'room' ? prev.rooms : prev.dms),
          [id]: ((type === 'room' ? prev.rooms[id] : prev.dms[id]) || 0) + 1,
        },
      }));
    },
    []
  );

  // Clear unread count and persist to Supabase
  const clearUnread = useCallback(
    (type: 'room' | 'dm', id: string) => {
      setUnreadCounts((prev) => {
        const targetCounts = type === 'room' ? prev.rooms : prev.dms;
        const { [id]: _, ...rest } = targetCounts;
        return {
          ...prev,
          [type === 'room' ? 'rooms' : 'dms']: rest,
        };
      });
      persistRead(type, id);
    },
    [persistRead]
  );

  // Add toast notification
  const addToast = useCallback((toast: Omit<NotificationToast, 'id' | 'timestamp'>) => {
    const newToast: NotificationToast = {
      ...toast,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };

    setToasts((prev) => {
      const updated = [...prev, newToast];
      return updated.slice(-MAX_TOASTS);
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, TOAST_DURATION);
  }, []);

  // Remove toast manually
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    unreadCounts,
    toasts,
    incrementUnread,
    clearUnread,
    addToast,
    removeToast,
  };
}
