'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendFriendRequest, fetchFriendshipStatus } from '@/lib/supabase/queries/lobbyQueries';
import { OnlineDot } from './OnlineDot';

interface SearchResult {
  id: string;
  username: string;
  exam_type: string | null;
  full_name: string | null;
}

interface FindPeopleProps {
  currentUserId: string;
  onlineUserIds?: Set<string>;
}

export function FindPeople({ currentUserId, onlineUserIds }: FindPeopleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [liveResults, setLiveResults] = useState<{ id: string; username: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Which term the last full (Go) search ran for — the "no users found" empty
  // state must not fire from mere typing.
  const [searchedTerm, setSearchedTerm] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState<Set<string>>(new Set());

  // Live suggestions while typing: debounced, first 5 usernames only.
  // Best-effort (no error surface) — the Go flow handles error messaging.
  useEffect(() => {
    const term = searchQuery.trim();
    // No suggestions for short terms or when full results for this exact
    // term are already displayed (e.g. right after clicking a suggestion)
    if (term.length < 2 || term === searchedTerm) {
      setLiveResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('user_profiles')
        .select('id, username')
        .ilike('username', `%${term}%`)
        .neq('id', currentUserId)
        .eq('is_bot', false)
        .limit(5);
      if (!cancelled) setLiveResults((data as { id: string; username: string }[]) ?? []);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, searchedTerm, currentUserId]);

  const handleSearch = useCallback(async (overrideTerm?: string) => {
    const term = (overrideTerm ?? searchQuery).trim();
    if (term.length < 2) return;
    setSearching(true);
    setSearchError(null);
    const supabase = createClient();

    // RLS returns EMPTY (not an error) for unauthenticated queries, so a
    // stale client session in a long-lived tab would masquerade as "no users
    // found". getSession() refreshes an expired token; if that fails, say so
    // instead of lying about the results.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSearchError('Your session has expired — refresh the page to search.');
      setSearching(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, exam_type, full_name')
      .ilike('username', `%${term}%`)
      .neq('id', currentUserId)
      .eq('is_bot', false) // bots can't receive friend requests
      .limit(10);
    if (error) {
      setSearchError('Search failed — please try again.');
      setSearchResults([]);
    } else {
      setSearchResults((data as SearchResult[]) ?? []);
    }
    setLiveResults([]); // suggestions are redundant once full results show
    setSearchedTerm(term);
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
      <h3 className="px-1 mb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
        Find People
      </h3>

      <div className="relative px-1 mb-2 flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Search by username…"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green placeholder-neutral-400"
          />
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={searching || searchQuery.trim().length < 2}
          className="px-3 py-1.5 bg-brand-green text-white text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-brand-green-dark transition-colors"
        >
          {searching ? '…' : 'Go'}
        </button>
      </div>

      {/* Live suggestions while typing — usernames only, capped at 5 */}
      {liveResults.length > 0 && (
        <div className="mx-1 mb-2 rounded-lg border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-100 overflow-hidden">
          {liveResults.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setSearchQuery(u.username);
                handleSearch(u.username);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              {u.username}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1">
        {searchResults.map((result) => {
          const initial = result.username?.[0]?.toUpperCase() || '?';
          const sent = requestSent.has(result.id);
          return (
            <div key={result.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-100">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white text-xs font-semibold">
                  {initial}
                </div>
                <OnlineDot show={onlineUserIds?.has(result.id) ?? false} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 truncate">{result.username}</p>
                {result.exam_type && <p className="text-xs text-neutral-500">{result.exam_type}</p>}
              </div>
              <button
                onClick={() => handleAddFriend(result.id)}
                disabled={sent}
                className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                  sent ? 'bg-neutral-200 text-neutral-400 cursor-default' : 'bg-green-100 text-brand-green-dark hover:bg-green-200'
                }`}
              >
                {sent ? 'Sent ✓' : '+ Add'}
              </button>
            </div>
          );
        })}
        {searchError && (
          <p className="text-xs text-red-500 px-3 py-4 text-center">{searchError}</p>
        )}
        {!searchError &&
          searchedTerm !== null &&
          searchQuery.trim() === searchedTerm &&
          searchResults.length === 0 &&
          !searching && (
            <p className="text-xs text-neutral-400 px-3 py-4 text-center">No users found for "{searchedTerm}"</p>
          )}
      </div>
    </div>
  );
}
