'use client';

import { useState } from 'react';
import type { LobbyRoom } from '@/lib/types/lobby';
import { UnreadBadge } from './UnreadBadge';
import { OnlineDot } from './OnlineDot';
import { usePinnedRooms } from '@/hooks/usePinnedRooms';

type DMConversation = {
  partner_id: string;
  partner_username: string;
  partner_avatar_url: string | null;
  last_message: string;
  last_message_at: string;
};

interface RoomListProps {
  rooms: LobbyRoom[];
  activeRoomId: string | null;
  onSelectRoom: (room: LobbyRoom) => void;
  currentUserId: string;
  onlineCountByRoom?: Record<string, number>;
  unreadCounts?: { [roomId: string]: number };
  dmConversations?: DMConversation[];
  activeDmPartnerId?: string | null;
  onSelectDM?: (partnerId: string) => void;
  dmUnreadCounts?: { [partnerId: string]: number };
  onlineUserIds?: Set<string>;
}

const MAX_PINS = 5;

function DMRow({
  dm,
  isActive,
  unread,
  online,
  onSelect,
}: {
  dm: DMConversation;
  isActive: boolean;
  unread: number;
  online: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
        isActive ? 'bg-green-50 text-brand-green-dark' : 'text-neutral-700 hover:bg-neutral-100'
      }`}
    >
      <span className="relative flex-shrink-0">
        <span className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-600 text-xs font-bold flex items-center justify-center">
          {dm.partner_username.charAt(0).toUpperCase()}
        </span>
        <OnlineDot show={online} />
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-brand-green-dark' : 'text-neutral-900'}`}>
          {dm.partner_username}
        </p>
        <p className="text-xs text-neutral-500 truncate">{dm.last_message}</p>
      </div>
      <UnreadBadge count={unread} />
    </button>
  );
}

function RoomRow({
  room,
  isActive,
  onlineCount,
  unread,
  onSelect,
}: {
  room: LobbyRoom;
  isActive: boolean;
  onlineCount: number;
  unread: number;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
        isActive ? 'bg-green-50 text-brand-green-dark' : 'text-neutral-700 hover:bg-neutral-100'
      }`}
    >
      <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-brand-green-dark' : 'text-neutral-900'}`}>
          {room.name}
        </p>
        <p className="text-xs text-neutral-500 truncate">{room.industry}</p>
      </div>
      <div className="flex items-center gap-2">
        {onlineCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            {onlineCount}
          </span>
        )}
        <UnreadBadge count={unread} />
      </div>
    </button>
  );
}

function PreferencesModal({
  rooms,
  pinnedIds,
  onToggle,
  onClose,
}: {
  rooms: LobbyRoom[];
  pinnedIds: string[];
  onToggle: (roomId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Pinned Rooms</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Select up to {MAX_PINS} rooms to pin to the top</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-3 space-y-1 max-h-80 overflow-y-auto">
          {rooms.map((room) => {
            const isPinned = pinnedIds.includes(room.id);
            const atCap = pinnedIds.length >= MAX_PINS;
            const disabled = !isPinned && atCap;
            return (
              <button
                key={room.id}
                onClick={() => !disabled && onToggle(room.id)}
                disabled={disabled}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                  isPinned
                    ? 'bg-amber-50 border-2 border-amber-400'
                    : disabled
                    ? 'bg-neutral-100 border-2 border-transparent opacity-40 cursor-not-allowed'
                    : 'bg-neutral-100 border-2 border-transparent hover:border-neutral-200'
                }`}
              >
                <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{room.name}</p>
                  <p className="text-xs text-neutral-500 truncate">{room.industry}</p>
                </div>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isPinned ? 'border-amber-500 bg-amber-500' : 'border-neutral-300'
                }`}>
                  {isPinned && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-neutral-200 flex items-center justify-between">
          <span className="text-xs text-neutral-400">{pinnedIds.length}/{MAX_PINS} selected</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function RoomList({
  rooms,
  activeRoomId,
  onSelectRoom,
  currentUserId,
  onlineCountByRoom,
  unreadCounts,
  dmConversations,
  activeDmPartnerId,
  onSelectDM,
  dmUnreadCounts,
  onlineUserIds,
}: RoomListProps) {
  const { pinnedIds, togglePin } = usePinnedRooms(currentUserId);
  const [showPrefs, setShowPrefs] = useState(false);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rooms.filter(r => r.name.toLowerCase().includes(q) || r.industry.toLowerCase().includes(q))
    : null;

  const pinnedOrdered = pinnedIds
    .map(id => rooms.find(r => r.id === id))
    .filter(Boolean) as LobbyRoom[];
  const unpinned = rooms.filter(r => !pinnedIds.includes(r.id));
  const hasPins = pinnedOrdered.length > 0;

  function renderRoom(room: LobbyRoom) {
    return (
      <RoomRow
        key={room.id}
        room={room}
        isActive={room.id === activeRoomId}
        onlineCount={onlineCountByRoom?.[room.id] || 0}
        unread={unreadCounts?.[room.id] || 0}
        onSelect={() => onSelectRoom(room)}
      />
    );
  }

  return (
    <>
      {showPrefs && (
        <PreferencesModal
          rooms={rooms}
          pinnedIds={pinnedIds}
          onToggle={togglePin}
          onClose={() => setShowPrefs(false)}
        />
      )}

      {/* Column split 50/50: Chats on top, Rooms below, each scrolling on its own */}
      <div className="h-full flex flex-col">
        {/* ── Top half: Chats (DMs) ── */}
        <div className="flex-1 min-h-0 flex flex-col p-3 pb-2">
          <h2 className="flex-shrink-0 text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3 mb-2">
            Chats
          </h2>
          <div className="flex-1 overflow-y-auto space-y-1">
            {dmConversations && dmConversations.length > 0 ? (
              dmConversations.map((dm) => (
                <DMRow
                  key={dm.partner_id}
                  dm={dm}
                  isActive={dm.partner_id === activeDmPartnerId}
                  unread={dmUnreadCounts?.[dm.partner_id] || 0}
                  online={onlineUserIds?.has(dm.partner_id) ?? false}
                  onSelect={() => onSelectDM?.(dm.partner_id)}
                />
              ))
            ) : (
              <p className="text-xs text-neutral-400 text-center py-6 px-3">
                No conversations yet — message someone from a room
              </p>
            )}
          </div>
        </div>

        {/* ── Bottom half: Rooms ── */}
        <div className="flex-1 min-h-0 flex flex-col border-t border-neutral-200 p-3 pt-2">
          <div className="flex-shrink-0 flex items-center justify-between px-3 mb-2">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              {hasPins ? (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Rooms
                </span>
              ) : 'Rooms'}
            </h2>
            <button
              onClick={() => setShowPrefs(true)}
              title="Customize pinned rooms"
              className="p-1 rounded-md hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>

          {/* Search input */}
          <div className="flex-shrink-0 relative px-1 mb-2">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search rooms…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green placeholder-neutral-400"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {filtered ? (
              filtered.length > 0
                ? filtered.map(renderRoom)
                : <p className="text-xs text-neutral-400 text-center py-4 px-3">No rooms match "{query}"</p>
            ) : (
              <>
                {hasPins && (
                  <>
                    {pinnedOrdered.map(renderRoom)}
                    <div className="my-2 border-t border-neutral-200" />
                    <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3 mb-2">
                      All Rooms
                    </h2>
                  </>
                )}
                {(hasPins ? unpinned : rooms).map(renderRoom)}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
