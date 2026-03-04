'use client';

import type { LobbyRoom } from '@/lib/types/lobby';

interface RoomListProps {
  rooms: LobbyRoom[];
  activeRoomId: string | null;
  onSelectRoom: (room: LobbyRoom) => void;
  onlineCountByRoom?: Record<string, number>;
}

export function RoomList({ rooms, activeRoomId, onSelectRoom, onlineCountByRoom }: RoomListProps) {
  return (
    <div className="p-3 space-y-1">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
        Rooms
      </h2>
      {rooms.map((room) => {
        const isActive = room.id === activeRoomId;
        const onlineCount = onlineCountByRoom?.[room.id] || 0;

        return (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{room.icon || '💬'}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isActive ? 'text-primary-700' : 'text-gray-900'}`}>
                {room.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{room.industry}</p>
            </div>
            {onlineCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {onlineCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
