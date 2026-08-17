'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchRoomMembers,
  removeRoomMember,
  promoteToCoAdmin,
  demoteToMember,
  type RoomMember,
} from '@/lib/supabase/queries/roomQueries';
import { InviteUserModal } from './InviteUserModal';

interface RoomMembersPanelProps {
  roomId: string;
  currentUserId: string;
  onClose: () => void;
}

const ROLE_LABEL: Record<RoomMember['role'], string> = {
  owner: 'Owner',
  co_admin: 'Co-admin',
  member: 'Member',
};

export function RoomMembersPanel({ roomId, currentUserId, onClose }: RoomMembersPanelProps) {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const load = useCallback(() => {
    fetchRoomMembers(roomId).then(setMembers).catch(() => setMembers([])).finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => { load(); }, [load]);

  const me = members.find((m) => m.user_id === currentUserId);
  const isOwner = me?.role === 'owner';
  const isAdmin = me?.role === 'owner' || me?.role === 'co_admin';

  const handleRemove = async (userId: string) => {
    await removeRoomMember(roomId, userId);
    load();
  };

  const handlePromote = async (userId: string) => {
    await promoteToCoAdmin(roomId, userId);
    load();
  };

  const handleDemote = async (userId: string) => {
    await demoteToMember(roomId, userId);
    load();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 flex-shrink-0">
          <h2 className="text-sm font-bold text-neutral-900">Members</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <p className="text-xs text-neutral-400 text-center py-6">Loading…</p>
          ) : (
            members.map((member) => (
              <div key={member.user_id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-50">
                <span className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {(member.username || '?').charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {member.username || 'Unknown'}
                    {member.user_id === currentUserId && ' (you)'}
                  </p>
                  <p className="text-xs text-neutral-400">{ROLE_LABEL[member.role]}</p>
                </div>
                {isOwner && member.role !== 'owner' && (
                  <button
                    onClick={() => member.role === 'co_admin' ? handleDemote(member.user_id) : handlePromote(member.user_id)}
                    className="text-xs font-semibold text-neutral-500 hover:text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100"
                  >
                    {member.role === 'co_admin' ? 'Demote' : 'Make co-admin'}
                  </button>
                )}
                {isAdmin && member.role !== 'owner' && member.user_id !== currentUserId && (
                  <button
                    onClick={() => handleRemove(member.user_id)}
                    className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-500"
                    title="Remove from room"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {isAdmin && (
          <div className="p-3 border-t border-neutral-100 flex-shrink-0">
            <button
              onClick={() => setShowInvite(true)}
              className="w-full py-2.5 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-colors"
            >
              Invite someone
            </button>
          </div>
        )}
      </div>

      {showInvite && (
        <InviteUserModal
          roomId={roomId}
          inviterId={currentUserId}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}
