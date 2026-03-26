'use client';

import { useRouter } from 'next/navigation';

// --- Types ---
export interface ExamSession {
  id: string;
  exam_type: 'CPA' | 'CFA' | 'FE';
  total_questions: number;
  score: number | null;
  percentage: number | null;
  time_taken_seconds: number | null;
  total_time_given_seconds: number | null;
  answered_count: number | null;
  unanswered_count: number | null;
  created_at: string;
  mode: 'practice' | 'timed' | null;
}

export type FilterMode = 'all' | 'practice' | 'timed';
export type FilterExam = 'all' | 'CPA' | 'CFA' | 'FE';

// --- Helpers ---
export function formatTime(seconds: number | null): string {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function formatDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

const EXAM_COLORS: Record<string, string> = {
  CPA: 'bg-blue-600',
  CFA: 'bg-violet-600',
  FE:  'bg-teal-600',
};

const MODE_STYLE: Record<string, string> = {
  practice: 'bg-purple-50 text-purple-700 border-purple-200',
  timed:    'bg-yellow-50 text-yellow-700 border-yellow-200',
};

function getScoreColor(pct: number | null): string {
  if (pct == null) return 'text-gray-400';
  if (pct >= 75) return 'text-emerald-600';
  if (pct >= 50) return 'text-amber-600';
  return 'text-red-500';
}

function getScoreBg(pct: number | null): string {
  if (pct == null) return 'bg-gray-50 border-gray-200';
  if (pct >= 75) return 'bg-emerald-50 border-emerald-200';
  if (pct >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

// --- SummaryBar ---
export function SummaryBar({ sessions }: { sessions: ExamSession[] }) {
  const total = sessions.length;
  const avg = total ? Math.round(sessions.reduce((a, s) => a + (s.percentage ?? 0), 0) / total) : 0;
  // FIX: removed dead `?? '0%'` — template literal is always truthy so it never fired
  const best = total ? Math.max(...sessions.map(s => s.percentage ?? 0)) : 0;
  const totalQs = sessions.reduce((a, s) => a + (s.answered_count ?? 0), 0);

  const stats = [
    { label: 'Sessions',     value: total,       icon: '📋' },
    { label: 'Avg Score',    value: `${avg}%`,   icon: '📊' },
    { label: 'Best Score',   value: `${best}%`,  icon: '🏆' },
    { label: 'Qs Attempted', value: totalQs,     icon: '✏️' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map(({ label, value, icon }) => (
        <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">{icon}</div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-black text-gray-900">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- SessionRow — FIX: now clickable, navigates to review page, restored Time + chevron ---
export function SessionRow({ session, index }: { session: ExamSession; index: number }) {
  const router = useRouter();
  const { date, time } = formatDate(session.created_at);
  const pct = session.percentage;

  return (
    <button
      onClick={() => router.push(`/history/${session.id}/review`)}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Exam badge + date */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-12 h-12 rounded-xl ${EXAM_COLORS[session.exam_type] ?? 'bg-gray-500'} text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow`}>
            {session.exam_type}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-700 transition-colors">
              {session.exam_type} Exam
            </p>
            <p className="text-xs text-gray-400">{date} · {time}</p>
          </div>
        </div>

        {/* Mode badge */}
        {session.mode && (
          <span className={`self-start sm:self-auto text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${MODE_STYLE[session.mode]}`}>
            {session.mode === 'timed' ? '⏱ Timed' : '📝 Practice'}
          </span>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">Questions</p>
            <p className="text-sm font-bold text-gray-700">
              {session.answered_count ?? '—'} / {session.total_questions}
            </p>
          </div>

          {/* FIX: Time column was missing */}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">Time</p>
            <p className="text-sm font-bold text-gray-700">
              {formatTime(session.time_taken_seconds)}
              {session.total_time_given_seconds && (
                <span className="font-normal text-gray-400"> / {formatTime(session.total_time_given_seconds)}</span>
              )}
            </p>
          </div>

          {/* Score pill — FIX: score number now has its own color class */}
          <div className={`px-4 py-2 rounded-xl border ${getScoreBg(pct)} min-w-[80px] text-center`}>
            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">Score</p>
            <p className={`text-xl font-black ${getScoreColor(pct)}`}>
              {pct != null ? `${pct}%` : '—'}
            </p>
            {session.score != null && (
              <p className="text-[10px] text-gray-400">{session.score} / {session.total_questions}</p>
            )}
          </div>

          {/* FIX: Chevron arrow was missing */}
          <div className="hidden sm:flex items-center text-gray-300 group-hover:text-blue-500 transition-colors">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
}

// --- HistoryFilters — FIX: Mode filter buttons were missing entirely ---
export function HistoryFilters({ mode, setMode, exam, setExam, count }: {
  mode: FilterMode;
  setMode: (v: FilterMode) => void;
  exam: FilterExam;
  setExam: (v: FilterExam) => void;
  count: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-4 mb-6">
      {/* Exam filter */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-gray-400">Exam</span>
        {(['all', 'CPA', 'CFA', 'FE'] as FilterExam[]).map(e => (
          <button
            key={e}
            onClick={() => setExam(e)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              exam === e ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {e === 'all' ? 'All' : e}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-200 hidden sm:block" />

      {/* Mode filter — was completely missing */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-gray-400">Mode</span>
        {(['all', 'practice', 'timed'] as FilterMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
              mode === m ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {m === 'all' ? 'All' : m}
          </button>
        ))}
      </div>

      <div className="ml-auto">
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
          {count} {count === 1 ? 'Session' : 'Sessions'}
        </span>
      </div>
    </div>
  );
}