'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { fetchUserProfile } from '@/lib/supabase/queries/lobbyQueries';
import type { LobbyMessage, LobbyRoom, LobbyUserProfile } from '@/lib/types/lobby';

interface RoomChatProps {
  room: LobbyRoom | null;
  messages: LobbyMessage[];
  loading: boolean;
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onClickUser: (userId: string) => void;
  dmPartner?: string | null;
  onBackToRooms?: () => void;
}

export function RoomChat({ room, messages, loading, currentUserId, onSendMessage, onClickUser, dmPartner, onBackToRooms }: RoomChatProps) {
  const [dmProfile, setDmProfile] = useState<LobbyUserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dmPartner) {
      fetchUserProfile(dmPartner).then(setDmProfile);
    } else {
      setDmProfile(null);
    }
  }, [dmPartner]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [room?.id, dmPartner]);

  if (!room && !dmPartner) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p>Select a room to start chatting</p>
      </div>
    );
  }

  const isDM = !!dmPartner;
  const initial = dmProfile?.username?.[0]?.toUpperCase() || '?';

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          {isDM && onBackToRooms && (
            <button
              onClick={onBackToRooms}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Back to rooms"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {isDM ? (
            <>
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                {initial}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{dmProfile?.username || 'User'}</h2>
                <p className="text-xs text-gray-500">Direct Message</p>
              </div>
            </>
          ) : (
            <>
              <span className="text-lg">{room?.icon}</span>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{room?.name}</h2>
                <p className="text-xs text-gray-500">{room?.description}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="text-center text-sm text-gray-400 py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-8">
            No messages yet. Be the first to say hi!
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwnMessage={msg.sender_id === currentUserId}
              onClickUser={onClickUser}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={onSendMessage} />
    </div>
  );
}
