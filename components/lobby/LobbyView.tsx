'use client';

import { useState, useCallback } from 'react';
import { useLobbyPresence } from '@/hooks/useLobbyPresence';
import { useLobbyMessages } from '@/hooks/useLobbyMessages';
import { useDMMessages } from '@/hooks/useDMMessages';
import { RoomList } from './RoomList';
import { RoomChat } from './RoomChat';
import { OnlineUsersList } from './OnlineUsersList';
import { MiniProfileCard } from './MiniProfileCard';
import { IndustrySelector } from './IndustrySelector';
import type { LobbyRoom, LobbyUserProfile } from '@/lib/types/lobby';

interface LobbyViewProps {
  rooms: LobbyRoom[];
  currentUser: {
    id: string;
    username: string;
    exam_type?: string;
    avatar_url?: string;
  };
  userProfile: LobbyUserProfile | null;
}

export function LobbyView({ rooms, currentUser, userProfile }: LobbyViewProps) {
  const [activeRoom, setActiveRoom] = useState<LobbyRoom | null>(rooms[0] || null);
  const [showIndustrySelector, setShowIndustrySelector] = useState(!userProfile?.industry);
  const [profileCardUserId, setProfileCardUserId] = useState<string | null>(null);
  const [profileCardPosition, setProfileCardPosition] = useState<{ top: number; left: number } | undefined>(undefined);
  const [chatMode, setChatMode] = useState<'room' | 'dm'>('room');
  const [dmPartnerId, setDmPartnerId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'rooms' | 'chat' | 'people'>('chat');

  const onlineUsers = useLobbyPresence(activeRoom?.slug || '', currentUser);
  const { messages: roomMessages, loading: roomLoading, sendMessage: sendRoomMessage } = useLobbyMessages(activeRoom?.id || null);
  const { messages: dmMessages, loading: dmLoading, sendDM } = useDMMessages(currentUser.id, dmPartnerId);

  const handleSendMessage = useCallback(
    (content: string) => {
      if (chatMode === 'dm') {
        sendDM(content);
      } else {
        sendRoomMessage(content, currentUser.id);
      }
    },
    [chatMode, sendDM, sendRoomMessage, currentUser.id]
  );

  const handleClickUser = useCallback((userId: string, position?: { top: number; left: number }) => {
    if (userId === currentUser.id) return;
    setProfileCardUserId(userId);
    setProfileCardPosition(position);
  }, [currentUser.id]);

  const handleStartDM = useCallback((userId: string) => {
    setDmPartnerId(userId);
    setChatMode('dm');
    setProfileCardUserId(null);
    setMobileTab('chat');
  }, []);

  const handleRoomSelect = useCallback((room: LobbyRoom) => {
    setActiveRoom(room);
    setChatMode('room');
    setMobileTab('chat');
  }, []);

  if (showIndustrySelector) {
    return (
      <IndustrySelector
        userId={currentUser.id}
        onSelected={() => setShowIndustrySelector(false)}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="md:hidden flex border-b border-gray-200 bg-white">
        {(['rooms', 'chat', 'people'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-3 text-sm font-medium text-center capitalize transition-colors ${
              mobileTab === tab
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[240px_1fr_280px] overflow-hidden">
        <aside
          className={`border-r border-gray-200 overflow-y-auto bg-white ${
            mobileTab === 'rooms' ? 'block' : 'hidden md:block'
          }`}
        >
          <RoomList
            rooms={rooms}
            activeRoomId={activeRoom?.id || null}
            onSelectRoom={handleRoomSelect}
          />
        </aside>

        <main
          className={`overflow-hidden ${
            mobileTab === 'chat' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
          }`}
        >
          <RoomChat
            room={chatMode === 'room' ? activeRoom : null}
            messages={chatMode === 'room' ? roomMessages : dmMessages}
            loading={chatMode === 'room' ? roomLoading : dmLoading}
            currentUserId={currentUser.id}
            onSendMessage={handleSendMessage}
            onClickUser={handleClickUser}
            dmPartner={chatMode === 'dm' ? dmPartnerId : null}
            onBackToRooms={chatMode === 'dm' ? () => setChatMode('room') : undefined}
          />
        </main>

        <aside
          className={`border-l border-gray-200 overflow-y-auto bg-white ${
            mobileTab === 'people' ? 'block' : 'hidden md:block'
          }`}
        >
          <OnlineUsersList
            users={onlineUsers}
            currentUserId={currentUser.id}
            onClickUser={handleClickUser}
          />
        </aside>
      </div>

      {profileCardUserId && (
        <MiniProfileCard
          userId={profileCardUserId}
          onClose={() => setProfileCardUserId(null)}
          onSendDM={handleStartDM}
          position={profileCardPosition}
        />
      )}
    </div>
  );
}
