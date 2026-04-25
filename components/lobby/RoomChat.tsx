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
  onSendMessage: (content: string) => Promise<boolean>;
  onClickUser: (userId: string) => void;
  dmPartner?: string | null;
  /** Desktop: go back to room mode from a DM */
  onBackToRooms?: () => void;
  /** Mobile: go back to conversation list */
  onBackToList?: () => void;
}

function getDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function DateSeparator({ date }: { date: Date }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[11px] font-medium text-gray-400 flex-shrink-0">
        {getDateLabel(date)}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

export function RoomChat({
  room,
  messages,
  loading,
  currentUserId,
  onSendMessage,
  onClickUser,
  dmPartner,
  onBackToRooms,
  onBackToList,
}: RoomChatProps) {
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

  // Primary back handler: mobile list takes priority over desktop rooms
  const backHandler = onBackToList || (isDM ? onBackToRooms : undefined);

  // Build message list with date separators
  const messageNodes: React.ReactNode[] = [];
  messages.forEach((msg, index) => {
    const msgDate = new Date(msg.created_at);
    const prevMsg = messages[index - 1];
    const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;

    if (!prevDate || msgDate.toDateString() !== prevDate.toDateString()) {
      messageNodes.push(<DateSeparator key={`sep-${msg.id}`} date={msgDate} />);
    }

    messageNodes.push(
      <MessageBubble
        key={msg.id}
        message={msg}
        isOwnMessage={msg.sender_id === currentUserId}
        onClickUser={onClickUser}
      />
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          {backHandler && (
            <button
              onClick={backHandler}
              className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              aria-label="Back"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {isDM ? (
            <>
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
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

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="text-center text-sm text-gray-400 py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-8">
            No messages yet. Be the first to say hi!
          </div>
        ) : (
          <div className="space-y-3">{messageNodes}</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={onSendMessage} />
    </div>
  );
}
