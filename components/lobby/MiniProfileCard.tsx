'use client';

import { useEffect, useState } from 'react';
import { fetchUserProfile } from '@/lib/supabase/queries/lobbyQueries';
import {
  fetchFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  type FriendshipStatus,
} from '@/lib/supabase/queries/lobbyQueries';
import type { LobbyUserProfile } from '@/lib/types/lobby';

interface MiniProfileCardProps {
  userId: string;
  currentUserId: string;
  onClose: () => void;
  onSendDM: (userId: string) => void;
  position?: { top: number; left: number };
}

export function MiniProfileCard({ userId, currentUserId, onClose, onSendDM, position }: MiniProfileCardProps) {
  const [profile, setProfile] = useState<LobbyUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus>('none');
  const [friendLoading, setFriendLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchUserProfile(userId),
      fetchFriendshipStatus(currentUserId, userId),
    ]).then(([p, fs]) => {
      setProfile(p);
      setFriendStatus(fs);
    }).finally(() => setLoading(false));
  }, [userId, currentUserId]);

  const handleFriendAction = async () => {
    setFriendLoading(true);
    try {
      if (friendStatus === 'none') {
        await sendFriendRequest(currentUserId, userId);
        setFriendStatus('pending_sent');
      } else if (friendStatus === 'pending_received') {
        await acceptFriendRequest(userId, currentUserId);
        setFriendStatus('accepted');
      }
    } catch {
      // silently fail — user sees no change
    } finally {
      setFriendLoading(false);
    }
  };

  const initial = profile?.username?.[0]?.toUpperCase() || '?';

  const cardStyle = position
    ? { top: `${position.top}px`, left: `${position.left}px` }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  const friendButtonProps = (() => {
    switch (friendStatus) {
      case 'accepted':
        return { label: 'Friends ✓', disabled: true, className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default' };
      case 'pending_sent':
        return { label: 'Request Sent', disabled: true, className: 'bg-gray-50 text-gray-500 border border-gray-200 cursor-default' };
      case 'pending_received':
        return { label: 'Accept Request', disabled: false, className: 'bg-blue-600 text-white hover:bg-blue-700' };
      default:
        return { label: 'Add Friend', disabled: false, className: 'bg-gray-100 text-gray-700 hover:bg-gray-200' };
    }
  })();

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className="fixed z-50 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4 animate-fade-in"
        style={cardStyle}
      >
        {loading ? (
          <div className="text-center text-sm text-gray-500 py-4">Loading...</div>
        ) : profile ? (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white text-lg font-semibold">
                {initial}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900">{profile.username || 'Unknown'}</span>
                  {profile.is_bot && (
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">bot</span>
                  )}
                </div>
                {profile.full_name && (
                  <p className="text-xs text-gray-500">{profile.full_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              {profile.exam_type && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="font-medium">Exam:</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{profile.exam_type}</span>
                </div>
              )}
              {profile.industry && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="font-medium">Industry:</span>
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{profile.industry}</span>
                </div>
              )}
              {profile.bio && (
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{profile.bio}</p>
              )}
            </div>

            {!profile.is_bot && (
              <div className="space-y-2">
                <button
                  onClick={handleFriendAction}
                  disabled={friendLoading || friendButtonProps.disabled}
                  className={`w-full py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 ${friendButtonProps.className}`}
                >
                  {friendLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      {friendButtonProps.label}
                    </span>
                  ) : friendButtonProps.label}
                </button>

                <button
                  onClick={() => { onSendDM(userId); onClose(); }}
                  className="w-full py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Send Message
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-sm text-gray-500 py-4">Profile not found</div>
        )}
      </div>
    </>
  );
}
