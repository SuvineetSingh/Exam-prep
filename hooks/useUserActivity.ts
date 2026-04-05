import { useEffect, useRef } from 'react';
import { updateUserOnlineStatus } from '@/lib/supabase/queries/lobbyQueries';

const UPDATE_INTERVAL = 60000; // Update every 60 seconds
const THROTTLE_DELAY = 10000; // Don't update more than once every 10 seconds

/**
 * Hook to track user activity and update their online status
 * Updates last_seen_at timestamp periodically while user is active
 */
export function useUserActivity(userId: string | null) {
  const lastUpdateRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateStatus = async () => {
    if (!userId) return;

    const now = Date.now();
    // Throttle: don't update if we updated recently
    if (now - lastUpdateRef.current < THROTTLE_DELAY) return;

    lastUpdateRef.current = now;
    await updateUserOnlineStatus(userId);
  };

  useEffect(() => {
    if (!userId) return;

    // Update immediately on mount
    updateStatus();

    // Update periodically while active
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateStatus();
      }
    }, UPDATE_INTERVAL);

    // Update when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId]);
}
