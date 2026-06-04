'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getXPProgress, BADGE_DEFINITIONS, type BadgeDefinition } from '@/lib/gamification/constants';
import { getUserXP } from '@/lib/gamification/xpEngine';
import { getEarnedBadgeKeys } from '@/lib/gamification/badgeEngine';

export interface XPToastEntry {
  id: string;
  amount: number;
  label: string;
}

export function useGamification(userId: string | undefined) {
  const [totalXp, setTotalXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [earnedKeys, setEarnedKeys] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<XPToastEntry[]>([]);
  const [newBadges, setNewBadges] = useState<BadgeDefinition[]>([]);
  const toastCounterRef = useRef(0);

  useEffect(() => {
    if (!userId) return;
    getUserXP(userId).then(data => {
      if (data) { setTotalXp(data.totalXp); setLevel(data.level); }
    });
    getEarnedBadgeKeys(userId).then(keys => setEarnedKeys(keys));
  }, [userId]);

  const addXPToast = useCallback((amount: number, label?: string) => {
    const id = `xp-${toastCounterRef.current++}`;
    setToasts(prev => [...prev, { id, amount, label: label ?? `+${amount} XP` }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2000);
  }, []);

  const applyXP = useCallback((amount: number) => {
    setTotalXp(prev => {
      const next = prev + amount;
      setLevel(getXPProgress(next).level);
      return next;
    });
  }, []);

  const revealBadges = useCallback((badges: BadgeDefinition[]) => {
    setNewBadges(prev => [...prev, ...badges]);
    setEarnedKeys(prev => {
      const next = new Set(prev);
      badges.forEach(b => next.add(b.key));
      return next;
    });
  }, []);

  const dismissBadge = useCallback(() => {
    setNewBadges(prev => prev.slice(1));
  }, []);

  const progress = getXPProgress(totalXp);

  return {
    totalXp,
    level,
    progress,
    earnedKeys,
    earnedBadges: BADGE_DEFINITIONS.filter(b => earnedKeys.has(b.key)),
    toasts,
    newBadges,
    addXPToast,
    applyXP,
    revealBadges,
    dismissBadge,
  };
}
