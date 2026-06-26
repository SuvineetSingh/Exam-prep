'use client';

import Link from 'next/link';
import { BADGE_DEFINITIONS, type BadgeDefinition } from '@/lib/gamification/constants';

interface BadgeShelfProps {
  earnedKeys: Set<string>;
  compact?: boolean;
}

export function BadgeShelf({ earnedKeys, compact = false }: BadgeShelfProps) {
  const earned = BADGE_DEFINITIONS.filter(b => earnedKeys.has(b.key));
  const locked = BADGE_DEFINITIONS.filter(b => !earnedKeys.has(b.key));

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {earned.map(b => (
          <BadgePill key={b.key} badge={b} earned />
        ))}
        {earned.length === 0 && (
          <p className="text-xs text-neutral-400 font-medium">No badges yet — keep practicing!</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {earned.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-extrabold uppercase text-neutral-400 tracking-wider mb-3">Earned ({earned.length})</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {earned.map(b => <BadgeCard key={b.key} badge={b} earned />)}
          </div>
        </div>
      )}
      <div>
        <p className="text-xs font-extrabold uppercase text-neutral-400 tracking-wider mb-3">Locked ({locked.length})</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {locked.map(b => <BadgeCard key={b.key} badge={b} earned={false} />)}
        </div>
      </div>
    </div>
  );
}

function BadgePill({ badge, earned }: { badge: BadgeDefinition; earned: boolean }) {
  return (
    <Link
      href={`/badges#badge-${badge.key}`}
      title={badge.description}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
        earned
          ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
          : 'bg-neutral-100 border-neutral-200 text-neutral-400 opacity-60'
      }`}
    >
      <span>{badge.emoji}</span>
      <span>{badge.name}</span>
    </Link>
  );
}

function BadgeCard({ badge, earned }: { badge: BadgeDefinition; earned: boolean }) {
  return (
    <div
      id={`badge-${badge.key}`}
      title={badge.description}
      className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 text-center transition-all scroll-mt-6 ${
        earned
          ? 'border-amber-200 bg-amber-50'
          : 'border-neutral-100 bg-neutral-50 opacity-40 grayscale'
      }`}
    >
      <span className="text-2xl">{badge.emoji}</span>
      <p className="text-[10px] font-extrabold text-neutral-700 leading-tight">{badge.name}</p>
    </div>
  );
}
