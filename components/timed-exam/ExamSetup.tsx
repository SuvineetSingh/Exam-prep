'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function ExamSetup() {
  const router = useRouter();
  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [config, setConfig] = useState({ examType: '', questionCount: 20 });
  const [loading, setLoading] = useState(false);
  const [fetchingFilters, setFetchingFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExamTypes = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('questions').select('exam_type');
      if (data) {
        const unique = Array.from(new Set(data.map((item) => item.exam_type))).sort();
        setExamTypes(unique);
      }
      setFetchingFilters(false);
    };
    fetchExamTypes();
  }, []);

  const timeLimit = config.questionCount * 1.5;

  const startExam = () => {
    if (!config.examType) {
      setError('Please select an exam type to continue.');
      return;
    }
    setError(null);
    setLoading(true);
    const sessionId = crypto.randomUUID();
    router.push(`/timed-exam/${sessionId}?type=${config.examType}&count=${config.questionCount}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-8 left-8">
        <Link
          href="/questions"
          className="inline-flex items-center gap-3 text-gray-400 hover:text-blue-600 transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-white shadow-sm border border-gray-100 group-hover:border-blue-200 group-hover:shadow-md transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Back</span>
        </Link>
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Exam Setup</h2>
        <p className="text-gray-500 mb-8">Configure your simulated exam environment.</p>

        <div className="space-y-8">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Exam Type</label>
            {fetchingFilters ? (
              <div className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 animate-pulse text-gray-400 text-sm">
                Loading exams...
              </div>
            ) : (
              <select
                className={`w-full p-4 rounded-xl border-2 ${error ? 'border-red-500 bg-red-50' : 'border-gray-50 bg-gray-50'} font-bold text-gray-700 focus:border-blue-500 focus:bg-white outline-none transition-all cursor-pointer`}
                value={config.examType}
                onChange={(e) => { setConfig({ ...config, examType: e.target.value }); setError(null); }}
              >
                <option value="">-- Select Exam Type --</option>
                {examTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            )}
            {error && <p className="text-red-500 text-xs mt-2 font-bold ml-1">{error}</p>}
          </div>

          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="block text-xs font-bold uppercase text-gray-400">Number of Questions</label>
              <span className="text-3xl font-black text-blue-600 leading-none">{config.questionCount}</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={config.questionCount}
              onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-5">
            <div className="flex justify-between items-center">
              <span className="text-amber-800 font-bold text-sm uppercase tracking-tight">Total Time:</span>
              <span className="text-amber-900 font-black text-2xl">{timeLimit} min</span>
            </div>
            <p className="text-amber-700/70 text-[11px] mt-2 font-medium leading-tight italic">
              Note: The timer will start immediately and cannot be paused.
            </p>
          </div>

          <button
            onClick={startExam}
            disabled={loading || fetchingFilters}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            {loading ? 'Initializing...' : 'Start Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}
