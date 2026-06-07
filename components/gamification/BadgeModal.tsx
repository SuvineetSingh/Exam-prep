'use client';

import { useEffect, useState } from 'react';
import type { BadgeDefinition } from '@/lib/gamification/constants';

interface BadgeModalProps {
  badge: BadgeDefinition | null;
  onDismiss: () => void;
}

export function BadgeModal({ badge, onDismiss }: BadgeModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (badge) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [badge]);

  if (!badge) return null;

  return (
    <div
      className={`fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onDismiss}
    >
      <div
        className={`bg-white rounded-3xl p-10 max-w-xs w-full text-center shadow-2xl transition-all duration-300 ${
          visible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-8'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-5 border-4 border-amber-200 shadow-inner">
          {badge.emoji}
        </div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-brand-amber mb-1">Badge Unlocked!</p>
        <h2 className="text-2xl font-extrabold text-neutral-900 mb-2">{badge.name}</h2>
        <p className="text-neutral-500 text-sm mb-8">{badge.description}</p>
        <button
          onClick={onDismiss}
          className="w-full py-4 bg-neutral-900 hover:bg-black text-white font-bold rounded-2xl transition-colors"
        >
          Awesome! 🎉
        </button>
      </div>
    </div>
  );
}
