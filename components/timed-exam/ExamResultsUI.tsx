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
  examType: string;
  date: string;
  sessionId: string;
}

export function ExamResultsUI({ 
  score, total, percentage, timeTaken, timeGiven, 
  answered, unanswered, examType, date, sessionId 
}: ResultsUIProps) {
  
  const getStars = (pct: number) => {
    if (pct >= 90) return '⭐⭐⭐⭐⭐';
    if (pct >= 75) return '⭐⭐⭐⭐';
    if (pct >= 50) return '⭐⭐⭐';
    return '⭐⭐';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Header Section */}
        <div className="bg-blue-600 p-10 text-center text-white">
          <div className="mb-4 inline-block px-4 py-1 bg-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest">
            {examType} Session
          </div>
          <p className="text-blue-100 font-bold uppercase text-xs mb-2 tracking-tighter">Overall Performance</p>
          <h1 className="text-7xl font-black mb-2">{score} <span className="text-3xl opacity-50">/ {total}</span></h1>
          <p className="text-2xl font-bold">{percentage}% Score</p>
          <div className="text-2xl mt-4 tracking-widest">{getStars(percentage)}</div>
        </div>

        <div className="p-10">
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
              <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Time Taken</span>
              <span className="text-lg font-bold text-gray-800">{timeTaken}</span>
              <span className="text-[10px] text-gray-400 block mt-1">out of {timeGiven}</span>
            </div>
            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
              <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Exam Date</span>
              <span className="text-sm font-bold text-gray-800 leading-tight">{date}</span>
            </div>
            <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100">
              <span className="text-[10px] font-black text-emerald-600 uppercase block mb-1">Answered</span>
              <span className="text-2xl font-black text-emerald-700">{answered}</span>
            </div>
            <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100">
              <span className="text-[10px] font-black text-amber-600 uppercase block mb-1">Unanswered</span>
              <span className="text-2xl font-black text-amber-700">{unanswered}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link 
              href={`/timed-exam/${sessionId}/review`}
              className="block w-full text-center py-5 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-lg active:scale-95"
            >
              Review Detailed Answers
            </Link>
            <div className="grid grid-cols-2 gap-4">
              <Link 
                href="/timed-exam" 
                className="text-center py-4 bg-white border-2 border-gray-100 text-gray-600 rounded-2xl font-bold hover:border-blue-600 hover:text-blue-600 transition-all"
              >
                Retake Exam
              </Link>
              <Link 
                href="/questions" 
                className="text-center py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold hover:bg-blue-100 transition-all"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}