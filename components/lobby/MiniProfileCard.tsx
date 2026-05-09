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
        return { label: 'Friends', disabled: true, iconClass: 'bg-emerald-100 text-emerald-600 cursor-default' };
      case 'pending_sent':
        return { label: 'Request Sent', disabled: true, iconClass: 'bg-gray-100 text-gray-400 cursor-default' };
      case 'pending_received':
        return { label: 'Accept Request', disabled: false, iconClass: 'bg-blue-100 text-blue-600 hover:bg-blue-200' };
      default:
        return { label: 'Add Friend', disabled: false, iconClass: 'bg-gray-100 text-gray-500 hover:bg-gray-200' };
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
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900 truncate">{profile.username || 'Unknown'}</span>
                  {profile.is_bot && (
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">bot</span>
                  )}
                </div>
                {profile.full_name && (
                  <p className="text-xs text-gray-500 truncate">{profile.full_name}</p>
                )}
              </div>
              {!profile.is_bot && (
                <button
                  onClick={handleFriendAction}
                  disabled={friendLoading || friendButtonProps.disabled}
                  title={friendButtonProps.label}
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${friendButtonProps.iconClass}`}
                >
                  {friendLoading ? (
                    <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  ) : friendStatus === 'accepted' ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : friendStatus === 'pending_sent' ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>
              )}
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
              <button
                onClick={() => { onSendDM(userId); onClose(); }}
                className="w-full py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Send Message
              </button>
            )}
          </div>
        ) : (
          <div className="text-center text-sm text-gray-500 py-4">Profile not found</div>
        )}
      </div>
    </>
  );
}
