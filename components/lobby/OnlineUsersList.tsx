'use client';

import type { OnlineUser } from '@/lib/types/lobby';

interface OnlineUsersListProps {
  users: OnlineUser[];
  currentUserId: string;
  onClickUser: (userId: string, position?: { top: number; left: number }) => void;
}

export function OnlineUsersList({ users, currentUserId, onClickUser }: OnlineUsersListProps) {
  const PROFILE_CARD_WIDTH = 256;
  const PROFILE_CARD_GAP = 8;

  return (
    <div className="p-3">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
        Online — {users.length}
      </h2>

      <div className="space-y-0.5">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          const initial = user.username?.[0]?.toUpperCase() || '?';

          return (
            <button
              key={user.id}
              onClick={(e) => {
                if (isCurrentUser) return;
                const rect = e.currentTarget.getBoundingClientRect();
                onClickUser(user.id, {
                  top: rect.top,
                  left: rect.left - PROFILE_CARD_WIDTH - PROFILE_CARD_GAP,
                });
              }}
              disabled={isCurrentUser}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                isCurrentUser ? 'opacity-60 cursor-default' : 'hover:bg-gray-50'
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold">
                  {initial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white online-dot" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {user.username}
                    {isCurrentUser && <span className="text-gray-400 font-normal"> (you)</span>}
                  </span>
                  {user.is_bot && (
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full leading-none">
                      bot
                    </span>
                  )}
                </div>
                {user.exam_type && (
                  <span className="text-xs text-gray-500">{user.exam_type}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {users.length === 0 && (
        <p className="text-xs text-gray-400 px-3 py-4 text-center">No one else is here yet</p>
      )}
    </div>
  );
}
