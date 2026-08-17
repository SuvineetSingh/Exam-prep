'use client';

import { useCallback, useState } from 'react';
import { searchRoomMessages } from '@/lib/supabase/queries/roomQueries';
import type { LobbyMessage } from '@/lib/types/lobby';

interface RoomSearchBarProps {
  roomId: string;
  onClose: () => void;
}

export function RoomSearchBar({ roomId, onClose }: RoomSearchBarProps) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<LobbyMessage[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const q = term.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      setResults(await searchRoomMessages(roomId, q));
    } catch {
      setResults([]);
    } finally {
      setSearched(true);
      setSearching(false);
    }
  }, [term, roomId]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-20">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[70vh] flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 flex-shrink-0">
          <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Search this room's messages…"
            className="flex-1 text-sm focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {searching && <p className="text-xs text-neutral-400 text-center py-6">Searching…</p>}
          {!searching && results.map((msg) => (
            <div key={msg.id} className="px-3 py-2 rounded-lg hover:bg-neutral-50">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-neutral-700">{msg.sender.username || 'Unknown'}</span>
                <span className="text-[10px] text-neutral-400">
                  {new Date(msg.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-neutral-600 truncate">{msg.content}</p>
            </div>
          ))}
          {!searching && searched && results.length === 0 && (
            <p className="text-xs text-neutral-400 text-center py-6">No messages match "{term.trim()}"</p>
          )}
        </div>
      </div>
    </div>
  );
}
