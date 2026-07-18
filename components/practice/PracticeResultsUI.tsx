'use client';

import Link from 'next/link';

interface PracticeResultsUIProps {
  score: number;
  total: number;
  percentage: number;
  timeTaken: string;
  unanswered: number;
  correct: number;
  incorrect: number;
  examType: string;
  date: string;
  sessionId: string;
}

export function PracticeResultsUI({
  score, total, percentage, timeTaken,
  unanswered, correct, incorrect, examType, date, sessionId
}: PracticeResultsUIProps) {

  const getMessage = (pct: number) => {
    if (pct >= 90) return { text: 'Outstanding!' };
    if (pct >= 75) return { text: 'Great job!' };
    if (pct >= 50) return { text: 'Keep it up!' };
    return { text: 'Keep studying!' };
  };

  const scoreColor =
    percentage >= 75 ? 'text-brand-green' :
    percentage >= 50 ? 'text-brand-amber' :
    'text-brand-coral';

  const { text } = getMessage(percentage);

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">

        {/* Score card */}
        <div className="card overflow-hidden mb-4">
          {/* Header */}
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-10 text-center text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-extrabold uppercase tracking-widest mb-5">
              {examType} · Practice Session
            </div>
            <h1 className={`text-7xl font-extrabold mb-1 ${scoreColor}`}>
              {percentage}<span className="text-3xl text-neutral-400 font-semibold">%</span>
            </h1>
            <p className="text-neutral-300 font-semibold text-lg">{text}</p>
            <p className="text-neutral-500 text-sm mt-1">
              {score} / {total} correct
            </p>
          </div>

          {/* Stats */}
          <div className="p-7">
            <div className="grid grid-cols-2 gap-3 mb-7">
              <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                <p className="section-label text-green-600 mb-1">Correct</p>
                <p className="text-3xl font-extrabold text-green-700">{correct}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                <p className="section-label text-red-500 mb-1">Incorrect</p>
                <p className="text-3xl font-extrabold text-red-600">{incorrect}</p>
              </div>
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <p className="section-label mb-1">Time Spent</p>
                <p className="text-xl font-extrabold text-neutral-800">{timeTaken}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <p className="section-label text-amber-600 mb-1">Skipped</p>
                <p className="text-3xl font-extrabold text-amber-700">{unanswered}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href={`/history/${sessionId}/review`}
                className="btn-primary w-full py-4 justify-center text-base"
              >
                Review Answers →
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/practice"
                  className="btn-secondary py-3.5 justify-center text-center text-sm"
                >
                  Practice More
                </Link>
                <Link
                  href="/dashboard"
                  className="btn-secondary py-3.5 justify-center text-center text-sm"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400">{date}</p>
      </div>
    </div>
  );
}
