'use client';

import { getXPProgress } from '@/lib/gamification/constants';

interface XPProgressBarProps {
  totalXp: number;
  compact?: boolean;
}

export function XPProgressBar({ totalXp, compact = false }: XPProgressBarProps) {
  const { level, currentXp, nextLevelXp, pct } = getXPProgress(totalXp);

  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Lv {level}</span>
          <span className="text-[10px] font-bold text-neutral-400">{currentXp}/{nextLevelXp} XP</span>
        </div>
        <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-green rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center text-white font-extrabold text-sm">
            {level}
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Level {level}</p>
            <p className="text-lg font-extrabold text-neutral-900">{totalXp.toLocaleString()} XP</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-neutral-400">{pct}%</p>
          <p className="text-[10px] text-neutral-400">to Lv {level + 1}</p>
        </div>
      </div>
      <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-green rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-neutral-400 mt-1.5">
        {currentXp} / {nextLevelXp} XP to next level
      </p>
    </div>
  );
}
