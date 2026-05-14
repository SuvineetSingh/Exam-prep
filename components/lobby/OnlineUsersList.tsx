'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendFriendRequest, fetchFriendshipStatus } from '@/lib/supabase/queries/lobbyQueries';
import type { OnlineUser } from '@/lib/types/lobby';

interface OnlineUsersListProps {
  users: OnlineUser[];
  currentUserId: string;
  onClickUser: (userId: string, position?: { top: number; left: number }) => void;
}

interface SearchResult {
  id: string;
  username: string;
  exam_type: string | null;
  full_name: string | null;
}

export function OnlineUsersList({ users, currentUserId, onClickUser }: OnlineUsersListProps) {
  const PROFILE_CARD_WIDTH = 256;
  const PROFILE_CARD_GAP = 8;
  const [query, setQuery] = useState('');

  // Find by username state
  const [findTab, setFindTab] = useState<'online' | 'find'>('online');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [requestSent, setRequestSent] = useState<Set<string>>(new Set());

  const q = query.trim().toLowerCase();
  const visible = q
    ? users.filter(u => u.username?.toLowerCase().includes(q))
    : users;

  const handleSearch = useCallback(async () => {
    const term = searchQuery.trim();
    if (term.length < 2) return;
    setSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('user_profiles')
      .select('id, username, exam_type, full_name')
      .ilike('username', `%${term}%`)
      .neq('id', currentUserId)
      .limit(10);
    setSearchResults((data as SearchResult[]) ?? []);
    setSearching(false);
  }, [searchQuery, currentUserId]);

  const handleAddFriend = useCallback(async (targetId: string) => {
    const status = await fetchFriendshipStatus(currentUserId, targetId);
    if (status !== 'none') {
      setRequestSent(prev => new Set(prev).add(targetId));
      return;
    }
    await sendFriendRequest(currentUserId, targetId);
    setRequestSent(prev => new Set(prev).add(targetId));
  }, [currentUserId]);

  return (
    <div className="p-3">
      {/* Tab bar: Online / Find */}
      <div className="flex gap-1 px-1 mb-3">
        <button
          onClick={() => setFindTab('online')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            findTab === 'online' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-100'
          }`}
        >
          Online — {users.length}
        </button>
        <button
          onClick={() => setFindTab('find')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            findTab === 'find' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-100'
          }`}
        >
          Find People
        </button>
      </div>

      {findTab === 'online' ? (
        <>
          {/* Search filter for online list */}
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
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full leading-none">bot</span>
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
        </>
      ) : (
        /* Find by Username */
        <div>
          <div className="relative px-1 mb-3 flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Search by username…"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400 placeholder-gray-400"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || searchQuery.trim().length < 2}
              className="px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-primary-700 transition-colors"
            >
              {searching ? '…' : 'Go'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 px-2 mb-3">Type at least 2 characters and press Go or Enter.</p>

          <div className="space-y-1">
            {searchResults.map((result) => {
              const initial = result.username?.[0]?.toUpperCase() || '?';
              const sent = requestSent.has(result.id);
              return (
                <div key={result.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{result.username}</p>
                    {result.exam_type && <p className="text-xs text-gray-500">{result.exam_type}</p>}
                  </div>
                  <button
                    onClick={() => handleAddFriend(result.id)}
                    disabled={sent}
                    className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                      sent ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                    }`}
                  >
                    {sent ? 'Sent ✓' : '+ Add'}
                  </button>
                </div>
              );
            })}
            {searchResults.length === 0 && searchQuery.trim().length >= 2 && !searching && (
              <p className="text-xs text-gray-400 px-3 py-4 text-center">No users found for "{searchQuery}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
