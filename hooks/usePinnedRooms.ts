'use client';

import { useState, useCallback, useEffect } from 'react';

const MAX_PINS = 5;

function storageKey(userId: string) {
  return `pinned_rooms:${userId}`;
}

export function usePinnedRooms(userId: string) {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (raw) setPinnedIds(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
  }, [userId]);

  const togglePin = useCallback((roomId: string) => {
    setPinnedIds(prev => {
      const already = prev.includes(roomId);
      const next = already
        ? prev.filter(id => id !== roomId)
        : prev.length < MAX_PINS
          ? [...prev, roomId]
          : prev; // silently ignore if at cap
      localStorage.setItem(storageKey(userId), JSON.stringify(next));
      return next;
    });
  }, [userId]);

  const isPinned = useCallback((roomId: string) => pinnedIds.includes(roomId), [pinnedIds]);
  const atCap = pinnedIds.length >= MAX_PINS;

  return { pinnedIds, togglePin, isPinned, atCap };
}
