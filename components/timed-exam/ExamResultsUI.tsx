'use client';

import Link from 'next/link';

interface ResultsUIProps {
  score: number;
  total: number;
  percentage: number;
  timeTaken: string;
  timeGiven: string;
  answered: number;
  unanswered: number;
  correct: number;
  incorrect: number;
  examType: string;
  date: string;
  sessionId: string;
}

export function ExamResultsUI({
  score, total, percentage, timeTaken, timeGiven,
  unanswered, correct, incorrect, examType, date, sessionId
}: ResultsUIProps) {

  const getMessage = (pct: number) => {
    if (pct >= 90) return { emoji: '🏆', text: 'Outstanding!' };
    if (pct >= 75) return { emoji: '🎉', text: 'Great job!' };
    if (pct >= 50) return { emoji: '💪', text: 'Keep it up!' };
    return { emoji: '📚', text: 'Keep studying!' };
  };

  const scoreColor =
    percentage >= 75 ? 'text-brand-green' :
    percentage >= 50 ? 'text-brand-amber' :
    'text-brand-coral';

  const { emoji, text } = getMessage(percentage);

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">

        {/* Score card */}
        <div className="card overflow-hidden mb-4">
          {/* Header */}
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-10 text-center text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-extrabold uppercase tracking-widest mb-5">
              {examType} · Timed Exam
            </div>
            <p className="text-6xl mb-2">{emoji}</p>
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
                <p className="section-label mb-1">Time Taken</p>
                <p className="text-xl font-extrabold text-neutral-800">{timeTaken}</p>
                <p className="text-xs text-neutral-400 mt-0.5">of {timeGiven} allowed</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <p className="section-label text-amber-600 mb-1">Skipped</p>
                <p className="text-3xl font-extrabold text-amber-700">{unanswered}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href={`/timed-exam/${sessionId}/review`}
                className="btn-primary w-full py-4 justify-center text-base"
              >
                Review Answers →
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/timed-exam"
                  className="btn-secondary py-3.5 justify-center text-center text-sm"
                >
                  Retake Exam
                </Link>
                <Link
                  href="/dashboard"
                  className="btn-ghost py-3.5 justify-center text-center text-sm bg-neutral-100 rounded-btn"
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
