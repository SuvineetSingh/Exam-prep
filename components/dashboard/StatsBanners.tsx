import type { UserStats } from '@/lib/types';

export function StatsBanners({ stats }: { stats: UserStats | null }) {
  const isNewUser = !stats || stats.total_answered === 0;

  const items = [
    {
      label: 'Study Streak',
      value: isNewUser ? '—' : `${stats.study_streak}d`,
      sub: isNewUser ? 'Answer a question to start' : `${stats.study_streak} days`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
      color: 'text-brand-amber',
      bg: 'bg-amber-50',
    },
    {
      label: 'Answered',
      value: isNewUser ? '0' : stats.total_answered.toLocaleString(),
      sub: isNewUser ? 'No questions yet' : `${stats.practice_answered} practice`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'text-brand-blue',
      bg: 'bg-blue-50',
    },
    {
      label: 'Accuracy',
      value: isNewUser ? '—' : `${stats.accuracy_rate}%`,
      sub: isNewUser ? 'No data yet' : stats.accuracy_rate >= 80 ? 'Excellent' : stats.accuracy_rate >= 60 ? 'Good' : 'Keep practicing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-brand-green',
      bg: 'bg-green-50',
    },
    {
      label: 'Today',
      value: !stats || stats.today_count === 0 ? '0' : stats.today_count.toString(),
      sub: !stats || stats.today_count === 0 ? 'Nothing yet today' : `${stats.today_count} answered`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-brand-purple',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((stat) => (
        <div key={stat.label} className="card px-4 py-4 flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.color}`}>
            {stat.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-400 mb-0.5">{stat.label}</p>
            <p className="text-xl font-extrabold text-neutral-900 leading-none">{stat.value}</p>
            <p className="text-[11px] text-neutral-400 mt-1 leading-tight">{stat.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
