'use client';

import { useEffect, useState } from 'react';
import { fetchPendingRoomInvites, respondToRoomInvite, type RoomInvite } from '@/lib/supabase/queries/roomQueries';

interface RoomInvitesListProps {
  userId: string;
  /** Bumped by LobbyView's room_invites subscription — see the realtime gotcha
   * noted throughout this file: this component must not open its own subscription. */
  version: number;
  onAccepted: (roomId: string) => void;
}

export function RoomInvitesList({ userId, version, onAccepted }: RoomInvitesListProps) {
  const [invites, setInvites] = useState<RoomInvite[]>([]);
  const [responding, setResponding] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPendingRoomInvites(userId).then(setInvites).catch(() => setInvites([]));
  }, [userId, version]);

  const handleRespond = async (invite: RoomInvite, accept: boolean) => {
    setResponding((prev) => new Set(prev).add(invite.id));
    try {
      await respondToRoomInvite(invite, userId, accept);
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      if (accept) onAccepted(invite.room_id);
    } finally {
      setResponding((prev) => {
        const next = new Set(prev);
        next.delete(invite.id);
        return next;
      });
    }
  };

  if (invites.length === 0) return null;

  return (
    <div className="flex-shrink-0 px-3 pt-3 space-y-1.5">
      <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider px-3 mb-1">
        Room Invites
      </h2>
      {invites.map((invite) => (
        <div key={invite.id} className="flex flex-col items-center text-center gap-2 px-3 py-2 rounded-lg bg-green-50">
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">{invite.room?.name || 'A room'}</p>
            <p className="text-xs text-neutral-500 truncate">from {invite.inviter?.username || 'someone'}</p>
          </div>
          <div className="flex flex-row justify-center gap-1.5">
            <button
              onClick={() => handleRespond(invite, true)}
              disabled={responding.has(invite.id)}
              className="text-xs font-bold px-2 py-1 rounded-lg bg-brand-green text-white hover:bg-brand-green-dark disabled:opacity-50 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => handleRespond(invite, false)}
              disabled={responding.has(invite.id)}
              className="text-xs font-bold px-2 py-1 rounded-lg bg-neutral-200 text-neutral-600 hover:bg-neutral-300 disabled:opacity-50 transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
