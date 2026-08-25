'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { fetchDMConversations, fetchFriendshipStatus } from '@/lib/supabase/queries/lobbyQueries';
import { fetchUserRooms } from '@/lib/supabase/queries/roomQueries';
import { logActivityEvent } from '@/lib/supabase/queries/activityQueries';
import { useOnlineUserIds } from '@/hooks/useOnlineUserIds';
import { useLobbyMessages } from '@/hooks/useLobbyMessages';
import { useDMMessages } from '@/hooks/useDMMessages';
import { useNotifications } from '@/hooks/useNotifications';
import { RoomList } from './RoomList';
import { RoomChat } from './RoomChat';
import { ConversationList } from './ConversationList';
import { FindPeople } from './FindPeople';
import { ActivityFeed } from './ActivityFeed';
import { MiniProfileCard } from './MiniProfileCard';
import { NotificationToast } from './NotificationToast';
import type { LobbyRoom, LobbyMessage, NotificationToast as NotificationToastType } from '@/lib/types/lobby';

type DMConversation = {
  partner_id: string;
  partner_username: string;
  partner_avatar_url: string | null;
  last_message: string;
  last_message_at: string;
};

interface LobbyViewProps {
  rooms: LobbyRoom[];
  currentUser: {
    id: string;
    username: string;
    exam_type?: string;
    avatar_url?: string;
  };
}

export function LobbyView({ rooms: initialRooms, currentUser }: LobbyViewProps) {
  const [rooms, setRooms] = useState<LobbyRoom[]>(initialRooms);
  const [activeRoom, setActiveRoom] = useState<LobbyRoom | null>(initialRooms[0] || null);
  const [profileCardUserId, setProfileCardUserId] = useState<string | null>(null);
  const [profileCardPosition, setProfileCardPosition] = useState<{ top: number; left: number } | undefined>(undefined);
  const [chatMode, setChatMode] = useState<'room' | 'dm'>('room');
  const [dmPartnerId, setDmPartnerId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'rooms' | 'chat' | 'people'>('chat');
  // 'list' = conversation history view, 'active' = open chat view
  const [chatView, setChatView] = useState<'list' | 'active'>('list');
  const [dmConversations, setDmConversations] = useState<DMConversation[]>([]);
  const [isPremium, setIsPremium] = useState(false);

  // Refs so stable async closures can read latest values
  const chatModeRef = useRef(chatMode);
  chatModeRef.current = chatMode;
  const dmPartnerIdRef = useRef(dmPartnerId);
  dmPartnerIdRef.current = dmPartnerId;

  // Lobby-wide presence — drives the green dots on avatars
  const onlineUserIds = useOnlineUserIds(currentUser);
  const { messages: roomMessages, loading: roomLoading, sendMessage: sendRoomMessage } = useLobbyMessages(activeRoom?.id || null);
  const { messages: dmMessages, loading: dmLoading, sendDM } = useDMMessages(currentUser.id, dmPartnerId);
  const { unreadCounts, toasts, incrementUnread, clearUnread, addToast, removeToast } = useNotifications(currentUser.id);

  // Track previous message states to detect new messages
  const prevRoomMessagesRef = useRef<LobbyMessage[]>([]);
  const prevDmMessagesRef = useRef<LobbyMessage[]>([]);

  // Same call Sidebar.tsx/Settings already make — course_subscriptions is the
  // authoritative Pro signal, not the (currently unreliable) is_premium flag.
  useEffect(() => {
    fetch('/api/me/pro')
      .then((r) => r.json())
      .then(({ isPro }: { isPro: boolean }) => setIsPremium(isPro))
      .catch(() => setIsPremium(false));
  }, [currentUser.id]);

  // ── Keep the desktop "Direct Messages" list (in RoomList) up to date ──
  useEffect(() => {
    let cancelled = false;
    const load = () => fetchDMConversations(currentUser.id).then((convs) => {
      if (!cancelled) setDmConversations(convs);
    }).catch(() => {});

    load();

    const supabase = createClient();
    const channel = supabase
      .channel(`dm-conversations:${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lobby_messages', filter: `sender_id=eq.${currentUser.id}` },
        load
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lobby_messages', filter: `recipient_id=eq.${currentUser.id}` },
        load
      )
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [currentUser.id]);

  // ── Friendships updates: partner invite toasts + a version counter for the
  // StudyPartnerPanel. The panel must NOT open its own friendships
  // subscription: overlapping postgres_changes bindings on the same
  // table+event from one socket collide in Realtime and one goes silent —
  // this listener is the single friendships subscription for the page. ──
  const [friendshipsVersion, setFriendshipsVersion] = useState(0);
  // Find Friends only claims half the sidebar once it has results to show —
  // otherwise Recent Activity gets the space.
  const [findPeopleHasResults, setFindPeopleHasResults] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    const handleInvite = async (payload: { new: Record<string, unknown> }) => {
      setFriendshipsVersion((v) => v + 1);
      const row = payload.new as {
        partner_status: string | null;
        partner_invited_by: string | null;
      };
      if (row.partner_status !== 'pending' || !row.partner_invited_by) return;
      if (row.partner_invited_by === currentUser.id) return;

      const { data: inviter } = await supabase
        .from('user_profiles')
        .select('username, avatar_url')
        .eq('id', row.partner_invited_by)
        .single();
      addToast({
        type: 'dm',
        senderId: row.partner_invited_by,
        senderName: inviter?.username || 'Someone',
        senderAvatar: inviter?.avatar_url || undefined,
        message: 'invited you to be study partners! 🤝',
        dmPartnerId: row.partner_invited_by,
      });
    };

    const channel = supabase
      .channel(`partner-invites:${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${currentUser.id}` },
        handleInvite
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'friendships', filter: `requester_id=eq.${currentUser.id}` },
        handleInvite
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentUser.id, addToast]);

  // ── Room invites: single subscription for this page, same rule as the
  // friendships listener above — RoomInvitesList takes a version counter
  // instead of subscribing itself. ──
  const [roomInvitesVersion, setRoomInvitesVersion] = useState(0);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room-invites:${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_invites', filter: `invitee_id=eq.${currentUser.id}` },
        async (payload) => {
          setRoomInvitesVersion((v) => v + 1);
          const row = payload.new as { room_id: string; inviter_id: string };
          const [{ data: room }, { data: inviter }] = await Promise.all([
            supabase.from('lobby_rooms').select('name').eq('id', row.room_id).single(),
            supabase.from('user_profiles').select('username, avatar_url').eq('id', row.inviter_id).single(),
          ]);
          addToast({
            type: 'room_invite',
            senderId: row.inviter_id,
            senderName: inviter?.username || 'Someone',
            senderAvatar: inviter?.avatar_url || undefined,
            message: `invited you to join "${room?.name || 'a room'}"`,
          });
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentUser.id, addToast]);

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

  // Passive discovery signal for the activity feed. Fires for the default
  // room on mount and on every room switch; repeated joins are collapsed at
  // feed read time, not here.
  useEffect(() => {
    if (!activeRoom) return;
    logActivityEvent(currentUser.id, 'room_joined', {
      room_id: activeRoom.id,
      room_slug: activeRoom.slug,
      room_name: activeRoom.name,
    });
  }, [activeRoom, currentUser.id]);

  const handleSendMessage = useCallback(
    (content: string): Promise<boolean> => {
      if (chatMode === 'dm') {
        // No prior history with this partner = a brand-new conversation.
        // Log it with the room the user was in for lobby→DM funnel analysis.
        const isFirstMessage = dmMessages.length === 0;
        return sendDM(content).then((ok) => {
          if (ok && isFirstMessage && dmPartnerId) {
            logActivityEvent(currentUser.id, 'dm_started', {
              partner_id: dmPartnerId,
              room_id: activeRoom?.id ?? null,
              room_slug: activeRoom?.slug ?? null,
            });
          }
          return ok;
        });
      }
      return sendRoomMessage(content, currentUser.id);
    },
    [chatMode, sendDM, sendRoomMessage, currentUser.id, dmMessages.length, dmPartnerId, activeRoom]
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

  // One-tap Message action: friends go straight into the DM; everyone else
  // gets the profile card, where Add Friend is the primary action (the
  // friends-only DM gate stays intact).
  const handleMessageUser = useCallback(
    async (userId: string, position?: { top: number; left: number }) => {
      if (userId === currentUser.id) return;
      const status = await fetchFriendshipStatus(currentUser.id, userId);
      if (status === 'accepted') {
        handleStartDM(userId);
      } else {
        setProfileCardUserId(userId);
        setProfileCardPosition(position);
      }
    },
    [currentUser.id, handleStartDM]
  );

  const handleRoomSelect = useCallback((room: LobbyRoom) => {
    setActiveRoom(room);
    setChatMode('room');
    setMobileTab('chat');
    setChatView('active');
  }, []);

  const handleRoomCreated = useCallback((room: LobbyRoom) => {
    setRooms((prev) => [...prev, room]);
    handleRoomSelect(room);
  }, [handleRoomSelect]);

  const handleInviteAccepted = useCallback(async (roomId: string) => {
    const updated = await fetchUserRooms();
    setRooms(updated);
    const room = updated.find((r) => r.id === roomId);
    if (room) handleRoomSelect(room);
  }, [handleRoomSelect]);

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

  // Deep-link support: `/lobby?room=<slug>` or `/lobby?dm=<userId>` (e.g. from
  // the sidebar). Depends on searchParams — the sidebar DM links navigate to
  // this same page, which only changes the query string without remounting,
  // so a mount-only effect would ignore every click after the first load.
  const searchParams = useSearchParams();
  useEffect(() => {
    const dmParam = searchParams.get('dm');
    const roomParam = searchParams.get('room');
    if (dmParam) {
      handleStartDM(dmParam);
    } else if (roomParam) {
      const room = rooms.find(r => r.slug === roomParam);
      if (room) handleRoomSelect(room);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  // On mobile, show ConversationList when chat tab is in 'list' view
  const showConversationList = mobileTab === 'chat' && chatView === 'list';
  // Show RoomChat on mobile when chat tab is in 'active' view
  const showActiveChat = mobileTab === 'chat' && chatView === 'active';

  return (
    <div className="h-[calc(100vh-5rem)] md:h-screen flex flex-col">
      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-neutral-200 bg-white">
        {(['rooms', 'chat', 'people'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-3 text-sm font-medium text-center capitalize transition-colors ${
              mobileTab === tab
                ? 'text-brand-green border-b-2 border-brand-green'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab === 'chat' ? 'Chats' : tab}
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[240px_1fr_280px] overflow-hidden">

        {/* Left: Rooms sidebar */}
        <aside
          className={`border-r border-neutral-200 overflow-hidden bg-white ${
            mobileTab === 'rooms' ? 'block' : 'hidden md:block'
          }`}
        >
          <RoomList
            rooms={rooms}
            activeRoomId={activeRoom?.id || null}
            onSelectRoom={handleRoomSelect}
            currentUserId={currentUser.id}
            unreadCounts={unreadCounts.rooms}
            dmConversations={dmConversations}
            activeDmPartnerId={chatMode === 'dm' ? dmPartnerId : null}
            onSelectDM={handleStartDM}
            dmUnreadCounts={unreadCounts.dms}
            onlineUserIds={onlineUserIds}
            isPremium={isPremium}
            onRoomCreated={handleRoomCreated}
            roomInvitesVersion={roomInvitesVersion}
            onInviteAccepted={handleInviteAccepted}
          />
        </aside>

        {/* Center: Conversation list (mobile only) or active chat */}
        <main className={`overflow-hidden ${
          mobileTab === 'chat' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
        }`}>
          {/* Mobile: conversation list view (desktop always shows the chat instead — see RoomList's Direct Messages section + always-on RoomChat below) */}
          {showConversationList && (
            <div className="md:hidden h-full">
              <ConversationList
                currentUserId={currentUser.id}
                rooms={rooms}
                unreadCounts={unreadCounts}
                onOpenRoom={handleRoomSelect}
                onOpenDM={handleStartDM}
              />
            </div>
          )}

          {/* Mobile active chat OR desktop always-on chat */}
          <div className={`flex flex-col h-full ${showConversationList ? 'hidden md:flex' : ''}`}>
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
              friendshipsVersion={friendshipsVersion}
              partnerOnline={chatMode === 'dm' && !!dmPartnerId && onlineUserIds.has(dmPartnerId)}
            />
          </div>
        </main>

        {/* Right: Find People + Recent Activity */}
        <aside
          className={`border-l border-neutral-200 overflow-hidden bg-white flex-col ${
            mobileTab === 'people' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div className={`min-h-0 overflow-hidden ${findPeopleHasResults ? 'flex-1 basis-0' : 'flex-none'}`}>
            <FindPeople
              currentUserId={currentUser.id}
              onlineUserIds={onlineUserIds}
              onResultsChange={setFindPeopleHasResults}
            />
          </div>
          <div className="flex-1 min-h-0 basis-0 overflow-hidden">
            <ActivityFeed
              currentUserId={currentUser.id}
              onClickUser={handleClickUser}
              onMessageUser={handleMessageUser}
              onlineUserIds={onlineUserIds}
            />
          </div>
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
