'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchDMConversations, fetchUserRoomActivity } from '@/lib/supabase/queries/lobbyQueries';
import { UnreadBadge } from './UnreadBadge';
import type { LobbyRoom } from '@/lib/types/lobby';

type ConversationItem = {
  type: 'dm' | 'room';
  id: string;
  name: string;
  last_message: string;
  last_message_at: string;
  icon?: string | null;
};

interface ConversationListProps {
  currentUserId: string;
  rooms: LobbyRoom[];
  unreadCounts: { rooms: Record<string, number>; dms: Record<string, number> };
  onOpenRoom: (room: LobbyRoom) => void;
  onOpenDM: (partnerId: string) => void;
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 py-16 text-center">
      <div className="relative mb-6 select-none">
        <div className="text-7xl">📭</div>
        <div className="absolute -bottom-1 -right-3 text-3xl rotate-12">😶</div>
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-2">
        Quieter than a library during finals
      </h3>
      <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
        No conversations yet. Jump into a <strong className="text-gray-500">Room</strong> to chat with the group, or open a{' '}
        <strong className="text-gray-500">DM</strong> from the People tab.
      </p>
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="space-y-1 p-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg animate-pulse">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
          <div className="h-3 bg-gray-100 rounded w-6" />
        </div>
      ))}
    </div>
  );
}

export function ConversationList({
  currentUserId,
  rooms,
  unreadCounts,
  onOpenRoom,
  onOpenDM,
}: ConversationListProps) {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function load() {
      setLoading(true);
      try {
        const [dmConvs, roomActivity] = await Promise.all([
          fetchDMConversations(currentUserId).catch(() => []),
          fetchUserRoomActivity(currentUserId).catch(() => []),
        ]);

        if (cancelledRef.current) return;

        const merged: ConversationItem[] = [
          ...dmConvs.map((c) => ({
            type: 'dm' as const,
            id: c.partner_id,
            name: c.partner_username,
            last_message: c.last_message,
            last_message_at: c.last_message_at,
          })),
          ...roomActivity.map((r) => {
            const room = rooms.find((rm) => rm.id === r.room_id);
            return {
              type: 'room' as const,
              id: r.room_id,
              name: room?.name || 'Room',
              last_message: r.last_message,
              last_message_at: r.last_message_at,
              icon: room?.icon,
            };
          }),
        ];

        merged.sort(
          (a, b) =>
            new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );

        setItems(merged);
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    }

    load();

    // Real-time: refresh list when I send a message or receive a DM
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation-refresh:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_messages',
          filter: `sender_id=eq.${currentUserId}`,
        },
        () => load()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_messages',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        () => load()
      )
      .subscribe();

    return () => {
      cancelledRef.current = true;
      channel.unsubscribe();
    };
  }, [currentUserId, rooms]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold text-gray-900">Conversations</h2>
        <p className="text-xs text-gray-400 mt-0.5">Your recent DMs and room activity</p>
      </div>

      {loading ? (
        <ConversationSkeleton />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {items.map((item) => {
            const unread =
              item.type === 'dm'
                ? unreadCounts.dms[item.id] || 0
                : unreadCounts.rooms[item.id] || 0;
            const initial = item.name[0]?.toUpperCase() || '?';

            return (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  if (item.type === 'dm') {
                    onOpenDM(item.id);
                  } else {
                    const room = rooms.find((r) => r.id === item.id);
                    if (room) onOpenRoom(room);
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50"
              >
                {/* Avatar / Icon */}
                <div className="relative flex-shrink-0">
                  {item.type === 'room' && item.icon ? (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                      {item.icon}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                      {initial}
                    </div>
                  )}
                  {item.type === 'room' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-sm font-medium truncate ${unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                      {item.name}
                    </span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                      {formatRelativeTime(item.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs truncate max-w-[170px] ${unread > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
                      {item.last_message}
                    </p>
                    <UnreadBadge count={unread} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
