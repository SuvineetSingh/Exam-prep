'use client';

import { Lato, Noto_Sans_Display } from 'next/font/google';
import { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { StudyPartnerPanel } from './StudyPartnerPanel';
import { OnlineDot } from './OnlineDot';
import { RoomMembersPanel } from './RoomMembersPanel';
import { RoomSearchBar } from './RoomSearchBar';
import { fetchUserProfile } from '@/lib/supabase/queries/lobbyQueries';
import type { LobbyMessage, LobbyRoom, LobbyUserProfile } from '@/lib/types/lobby';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-lato',
  display: 'swap',
});

const notoSansDisplay = Noto_Sans_Display({
  subsets: ['latin'],
  variable: '--font-noto-display',
  display: 'swap',
});

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
  /** Bumped by LobbyView's friendships subscription; triggers partner-panel refetch */
  friendshipsVersion?: number;
  /** Whether the DM partner is currently online (green dot on the header avatar) */
  partnerOnline?: boolean;
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
      <div className="flex-1 h-px bg-neutral-200" />
      <span className="text-[11px] font-medium text-neutral-400 flex-shrink-0">
        {getDateLabel(date)}
      </span>
      <div className="flex-1 h-px bg-neutral-200" />
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
  friendshipsVersion,
  partnerOnline,
}: RoomChatProps) {
  const [dmProfile, setDmProfile] = useState<LobbyUserProfile | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
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
      <div className="flex-1 flex items-center justify-center text-neutral-400">
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
    <div className={`${lato.variable} ${notoSansDisplay.variable} font-chat flex flex-col h-full`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-2">
          {backHandler && (
            <button
              onClick={backHandler}
              className="p-1 hover:bg-neutral-200 rounded transition-colors flex-shrink-0"
              aria-label="Back"
            >
              <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {isDM ? (
            <>
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white text-sm font-semibold">
                  {initial}
                </div>
                <OnlineDot show={!!partnerOnline} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">{dmProfile?.username || 'User'}</h2>
                <p className="text-xs text-neutral-500">
                  {partnerOnline ? 'Online' : 'Direct Message'}
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="text-lg">{room?.icon}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-neutral-900">{room?.name}</h2>
                <p className="text-xs text-neutral-500">{room?.description}</p>
              </div>
              {room && (
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
                  title="Search messages"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
              {room?.is_user_created && (
                <button
                  onClick={() => setShowMembers(true)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
                  title="Members"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4a4 4 0 10-4-4 4 4 0 004 4zm6 4a4 4 0 10-4-4" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showMembers && room && (
        <RoomMembersPanel
          roomId={room.id}
          currentUserId={currentUserId}
          onClose={() => setShowMembers(false)}
        />
      )}

      {showSearch && room && (
        <RoomSearchBar roomId={room.id} onClose={() => setShowSearch(false)} />
      )}

      {/* Study partner invite/status (DMs only; renders nothing unless friends) */}
      {isDM && dmPartner && (
        <StudyPartnerPanel
          currentUserId={currentUserId}
          partnerId={dmPartner}
          partnerUsername={dmProfile?.username || 'your friend'}
          friendshipsVersion={friendshipsVersion}
        />
      )}

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="text-center text-sm text-neutral-400 py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-neutral-400 py-8">
            No messages yet. Be the first to say hi!
          </div>
        ) : (
          <div className="space-y-3">{messageNodes}</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSend={onSendMessage}
        attachmentRoomId={!isDM && room ? room.id : undefined}
        currentUserId={currentUserId}
      />
    </div>
  );
}
