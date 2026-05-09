'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLobbyPresence } from '@/hooks/useLobbyPresence';
import { useLobbyMessages } from '@/hooks/useLobbyMessages';
import { useDMMessages } from '@/hooks/useDMMessages';
import { useNotifications } from '@/hooks/useNotifications';
import { RoomList } from './RoomList';
import { RoomChat } from './RoomChat';
import { ConversationList } from './ConversationList';
import { OnlineUsersList } from './OnlineUsersList';
import { MiniProfileCard } from './MiniProfileCard';
import { IndustrySelector } from './IndustrySelector';
import { NotificationToast } from './NotificationToast';
import type { LobbyRoom, LobbyUserProfile, LobbyMessage, NotificationToast as NotificationToastType } from '@/lib/types/lobby';

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
  // 'list' = conversation history view, 'active' = open chat view
  const [chatView, setChatView] = useState<'list' | 'active'>('list');

  // Refs so stable async closures can read latest values
  const chatModeRef = useRef(chatMode);
  chatModeRef.current = chatMode;
  const dmPartnerIdRef = useRef(dmPartnerId);
  dmPartnerIdRef.current = dmPartnerId;

  const onlineUsers = useLobbyPresence(activeRoom?.slug || '', currentUser);
  const { messages: roomMessages, loading: roomLoading, sendMessage: sendRoomMessage } = useLobbyMessages(activeRoom?.id || null);
  const { messages: dmMessages, loading: dmLoading, sendDM } = useDMMessages(currentUser.id, dmPartnerId);
  const { unreadCounts, toasts, incrementUnread, clearUnread, addToast, removeToast } = useNotifications(currentUser.id);

  // Track previous message states to detect new messages
  const prevRoomMessagesRef = useRef<LobbyMessage[]>([]);
  const prevDmMessagesRef = useRef<LobbyMessage[]>([]);

  // ── Global DM listener: catches DMs from ANY sender, not just the active partner ──
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`incoming-dms:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_messages',
          filter: `recipient_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as { id: string; sender_id: string; message_type: string };
          if (newMsg.message_type !== 'dm') return;

          // Skip if the active DM hook already handles this conversation
          if (chatModeRef.current === 'dm' && dmPartnerIdRef.current === newMsg.sender_id) return;

          const { data } = await supabase
            .from('lobby_messages')
            .select('*, sender:user_profiles!sender_id(username, avatar_url)')
            .eq('id', newMsg.id)
            .single();

          if (data) {
            incrementUnread('dm', newMsg.sender_id);
            addToast({
              type: 'dm',
              senderId: newMsg.sender_id,
              senderName: (data.sender as { username?: string })?.username || 'Someone',
              senderAvatar: (data.sender as { avatar_url?: string })?.avatar_url || undefined,
              message: data.content,
              dmPartnerId: newMsg.sender_id,
            });
          }
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentUser.id, incrementUnread, addToast]);

  const handleSendMessage = useCallback(
    (content: string): Promise<boolean> => {
      if (chatMode === 'dm') {
        return sendDM(content);
      }
      return sendRoomMessage(content, currentUser.id);
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
    setChatView('active');
  }, []);

  const handleRoomSelect = useCallback((room: LobbyRoom) => {
    setActiveRoom(room);
    setChatMode('room');
    setMobileTab('chat');
    setChatView('active');
  }, []);

  const handleBackToList = useCallback(() => {
    setChatView('list');
  }, []);

  const handleToastClick = useCallback((toast: NotificationToastType) => {
    if (toast.type === 'room' && toast.roomId) {
      const room = rooms.find(r => r.id === toast.roomId);
      if (room) handleRoomSelect(room);
    } else if (toast.type === 'dm' && toast.dmPartnerId) {
      handleStartDM(toast.dmPartnerId);
    }
    removeToast(toast.id);
  }, [rooms, handleRoomSelect, handleStartDM, removeToast]);

  // Detect new room messages and trigger notifications
  useEffect(() => {
    if (roomMessages.length > prevRoomMessagesRef.current.length) {
      const newMessages = roomMessages.slice(prevRoomMessagesRef.current.length);

      newMessages.forEach(msg => {
        if (msg.sender_id === currentUser.id) return;
        if (chatMode === 'room' && activeRoom?.id === msg.room_id) return;

        incrementUnread('room', msg.room_id || '');
        addToast({
          type: 'room',
          senderId: msg.sender_id,
          senderName: msg.sender.username || 'Unknown',
          senderAvatar: msg.sender.avatar_url || undefined,
          message: msg.content,
          roomId: msg.room_id || undefined,
          roomName: rooms.find(r => r.id === msg.room_id)?.name,
        });
      });
    }

    prevRoomMessagesRef.current = roomMessages;
  }, [roomMessages, activeRoom?.id, chatMode, currentUser.id, rooms, incrementUnread, addToast]);

  // Detect new DM messages from the active partner and trigger notifications
  useEffect(() => {
    if (dmMessages.length > prevDmMessagesRef.current.length) {
      const newMessages = dmMessages.slice(prevDmMessagesRef.current.length);

      newMessages.forEach(msg => {
        if (msg.sender_id === currentUser.id) return;
        if (chatMode === 'dm' && dmPartnerId === msg.sender_id) return;

        incrementUnread('dm', msg.sender_id);
        addToast({
          type: 'dm',
          senderId: msg.sender_id,
          senderName: msg.sender.username || 'Unknown',
          senderAvatar: msg.sender.avatar_url || undefined,
          message: msg.content,
          dmPartnerId: msg.sender_id,
        });
      });
    }

    prevDmMessagesRef.current = dmMessages;
  }, [dmMessages, dmPartnerId, chatMode, currentUser.id, incrementUnread, addToast]);

  // Clear unread when switching to room
  useEffect(() => {
    if (chatMode === 'room' && activeRoom?.id) {
      clearUnread('room', activeRoom.id);
    }
  }, [chatMode, activeRoom?.id, clearUnread]);

  // Clear unread when switching to DM
  useEffect(() => {
    if (chatMode === 'dm' && dmPartnerId) {
      clearUnread('dm', dmPartnerId);
    }
  }, [chatMode, dmPartnerId, clearUnread]);

  if (showIndustrySelector) {
    return (
      <IndustrySelector
        userId={currentUser.id}
        onSelected={() => setShowIndustrySelector(false)}
      />
    );
  }

  // On mobile, show ConversationList when chat tab is in 'list' view
  const showConversationList = mobileTab === 'chat' && chatView === 'list';
  // Show RoomChat on mobile when chat tab is in 'active' view
  const showActiveChat = mobileTab === 'chat' && chatView === 'active';

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Mobile tab bar */}
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
            {tab === 'chat' ? 'Chats' : tab}
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[240px_1fr_280px] overflow-hidden">

        {/* Left: Rooms sidebar */}
        <aside
          className={`border-r border-gray-200 overflow-y-auto bg-white ${
            mobileTab === 'rooms' ? 'block' : 'hidden md:block'
          }`}
        >
          <RoomList
            rooms={rooms}
            activeRoomId={activeRoom?.id || null}
            onSelectRoom={handleRoomSelect}
            currentUserId={currentUser.id}
            unreadCounts={unreadCounts.rooms}
          />
        </aside>

        {/* Center: Conversation list (mobile only) or active chat */}
        <main className={`overflow-hidden ${
          mobileTab === 'chat' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
        }`}>
          {/* Mobile: conversation list view */}
          {showConversationList && (
            <ConversationList
              currentUserId={currentUser.id}
              rooms={rooms}
              unreadCounts={unreadCounts}
              onOpenRoom={handleRoomSelect}
              onOpenDM={handleStartDM}
            />
          )}

          {/* Mobile active chat OR desktop always-on chat */}
          <div className={`flex flex-col h-full ${showConversationList ? 'hidden' : ''}`}>
            <RoomChat
              room={chatMode === 'room' ? activeRoom : null}
              messages={chatMode === 'room' ? roomMessages : dmMessages}
              loading={chatMode === 'room' ? roomLoading : dmLoading}
              currentUserId={currentUser.id}
              onSendMessage={handleSendMessage}
              onClickUser={handleClickUser}
              dmPartner={chatMode === 'dm' ? dmPartnerId : null}
              onBackToRooms={chatMode === 'dm' ? () => setChatMode('room') : undefined}
              onBackToList={showActiveChat ? handleBackToList : undefined}
            />
          </div>
        </main>

        {/* Right: People sidebar */}
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
          currentUserId={currentUser.id}
          onClose={() => setProfileCardUserId(null)}
          onSendDM={handleStartDM}
          position={profileCardPosition}
        />
      )}

      {/* Notification Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <NotificationToast
            key={toast.id}
            toast={toast}
            index={index}
            onClose={removeToast}
            onClick={handleToastClick}
          />
        ))}
      </div>
    </div>
  );
}
