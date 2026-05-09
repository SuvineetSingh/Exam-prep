'use client';

import { useState } from 'react';
import type { OnlineUser } from '@/lib/types/lobby';

interface OnlineUsersListProps {
  users: OnlineUser[];
  currentUserId: string;
  onClickUser: (userId: string, position?: { top: number; left: number }) => void;
}

export function OnlineUsersList({ users, currentUserId, onClickUser }: OnlineUsersListProps) {
  const PROFILE_CARD_WIDTH = 256;
  const PROFILE_CARD_GAP = 8;
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const visible = q
    ? users.filter(u => u.username?.toLowerCase().includes(q))
    : users;

  return (
    <div className="p-3">
      {/* Header */}
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
        Online — {users.length}
      </h2>

      {/* Search input */}
      <div className="relative px-1 mb-3">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search people…"
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400 placeholder-gray-400"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Users list */}
      <div className="space-y-0.5">
        {visible.map((user) => {
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

      {visible.length === 0 && (
        <p className="text-xs text-gray-400 px-3 py-4 text-center">
          {q ? `No one matching "${query}"` : 'No one else is here yet'}
        </p>
      )}
    </div>
  );
}
