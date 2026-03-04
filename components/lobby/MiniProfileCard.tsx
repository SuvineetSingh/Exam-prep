'use client';

import { useEffect, useState } from 'react';
import { fetchUserProfile } from '@/lib/supabase/queries/lobbyQueries';
import type { LobbyUserProfile } from '@/lib/types/lobby';

interface MiniProfileCardProps {
  userId: string;
  onClose: () => void;
  onSendDM: (userId: string) => void;
  position?: { top: number; left: number };
}

export function MiniProfileCard({ userId, onClose, onSendDM, position }: MiniProfileCardProps) {
  const [profile, setProfile] = useState<LobbyUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile(userId)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [userId]);

  const initial = profile?.username?.[0]?.toUpperCase() || '?';

  const cardStyle = position
    ? { top: `${position.top}px`, left: `${position.left}px` }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className="fixed z-50 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-fade-in"
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
                <p className="text-xs text-gray-500 mt-2">{profile.bio}</p>
              )}
            </div>

            {!profile.is_bot && (
              <button
                onClick={() => {
                  onSendDM(userId);
                  onClose();
                }}
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
