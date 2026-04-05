import { useState, useEffect, useCallback, useRef } from 'react';
import type { NotificationToast, UnreadCounts } from '@/lib/types/lobby';

const MAX_TOASTS = 3;
const TOAST_DURATION = 5000; // 5 seconds
const LOCALSTORAGE_DEBOUNCE = 500; // 500ms

export function useNotifications(userId: string) {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({ rooms: {}, dms: {} });
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const localStorageKey = `lobby_unread_${userId}`;

  // Load unread counts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUnreadCounts(parsed);
      }
    } catch (error) {
      console.error('Failed to load unread counts from localStorage:', error);
    }
  }, [localStorageKey]);

  // Debounced save to localStorage
  const saveToLocalStorage = useCallback(
    (counts: UnreadCounts) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(counts));
        } catch (error) {
          console.error('Failed to save unread counts to localStorage:', error);
        }
      }, LOCALSTORAGE_DEBOUNCE);
    },
    [localStorageKey]
  );

  // Increment unread count
  const incrementUnread = useCallback(
    (type: 'room' | 'dm', id: string) => {
      setUnreadCounts((prev) => {
        const newCounts = {
          ...prev,
          [type === 'room' ? 'rooms' : 'dms']: {
            ...(type === 'room' ? prev.rooms : prev.dms),
            [id]: ((type === 'room' ? prev.rooms[id] : prev.dms[id]) || 0) + 1,
          },
        };
        saveToLocalStorage(newCounts);
        return newCounts;
      });
    },
    [saveToLocalStorage]
  );

  // Clear unread count
  const clearUnread = useCallback(
    (type: 'room' | 'dm', id: string) => {
      setUnreadCounts((prev) => {
        const targetCounts = type === 'room' ? prev.rooms : prev.dms;
        const { [id]: _, ...rest } = targetCounts;

        const newCounts = {
          ...prev,
          [type === 'room' ? 'rooms' : 'dms']: rest,
        };
        saveToLocalStorage(newCounts);
        return newCounts;
      });
    },
    [saveToLocalStorage]
  );

  // Add toast notification
  const addToast = useCallback((toast: Omit<NotificationToast, 'id' | 'timestamp'>) => {
    const newToast: NotificationToast = {
      ...toast,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };

    setToasts((prev) => {
      const updated = [...prev, newToast];
      // Keep only the last MAX_TOASTS (FIFO - remove oldest)
      return updated.slice(-MAX_TOASTS);
    });

    // Auto-dismiss after TOAST_DURATION
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, TOAST_DURATION);
  }, []);

  // Remove toast manually
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    unreadCounts,
    toasts,
    incrementUnread,
    clearUnread,
    addToast,
    removeToast,
  };
}
