'use client';

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { inviteToRoom } from '@/lib/supabase/queries/roomQueries';

interface SearchResult {
  id: string;
  username: string;
}

interface InviteUserModalProps {
  roomId: string;
  inviterId: string;
  onClose: () => void;
}

export function InviteUserModal({ roomId, inviterId, onClose }: InviteUserModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    const term = query.trim();
    if (term.length < 2) return;
    setSearching(true);
    setError(null);
    const supabase = createClient();
    const { data, error: searchError } = await supabase
      .from('user_profiles')
      .select('id, username')
      .ilike('username', `%${term}%`)
      .neq('id', inviterId)
      .eq('is_bot', false)
      .limit(10);

    if (searchError) {
      setError('Search failed — please try again.');
      setResults([]);
    } else {
      setResults((data as SearchResult[]) ?? []);
    }
    setSearched(true);
    setSearching(false);
  }, [query, inviterId]);

  const handleInvite = async (userId: string) => {
    try {
      await inviteToRoom(roomId, inviterId, userId);
      setInvited((prev) => new Set(prev).add(userId));
    } catch {
      setError('Failed to send invite — they may already have a pending invite.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-neutral-900">Invite someone</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Search by username…"
            className="input flex-1"
            autoFocus
          />
          <button
            onClick={handleSearch}
            disabled={searching || query.trim().length < 2}
            className="px-3 py-1.5 bg-brand-green text-white text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-brand-green-dark transition-colors"
          >
            {searching ? '…' : 'Go'}
          </button>
        </div>

        <div className="space-y-1 max-h-64 overflow-y-auto">
          {results.map((result) => {
            const done = invited.has(result.id);
            return (
              <div key={result.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-neutral-50">
                <span className="w-7 h-7 rounded-full bg-brand-green flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {result.username.charAt(0).toUpperCase()}
                </span>
                <p className="text-sm font-medium text-neutral-900 truncate flex-1">{result.username}</p>
                <button
                  onClick={() => handleInvite(result.id)}
                  disabled={done}
                  className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                    done ? 'bg-neutral-200 text-neutral-400 cursor-default' : 'bg-green-100 text-brand-green-dark hover:bg-green-200'
                  }`}
                >
                  {done ? 'Invited ✓' : 'Invite'}
                </button>
              </div>
            );
          })}
          {error && <p className="text-xs text-red-500 px-2 py-3 text-center">{error}</p>}
          {!error && searched && results.length === 0 && !searching && (
            <p className="text-xs text-neutral-400 px-2 py-3 text-center">No users found for "{query.trim()}"</p>
          )}
        </div>
      </div>
    </div>
  );
}
