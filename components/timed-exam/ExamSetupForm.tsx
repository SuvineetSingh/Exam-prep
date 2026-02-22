'use client';

import Link from 'next/link';

interface ExamSetupFormProps {
  examTypes: string[];
  config: { examType: string; questionCount: number };
  setConfig: (config: any) => void;
  loading: boolean;
  fetchingFilters: boolean;
  error: string | null;
  onStart: () => void;
  timeLimit: number;
}

export function ExamSetupForm({
  examTypes,
  config,
  setConfig,
  loading,
  fetchingFilters,
  error,
  onStart,
  timeLimit,
}: ExamSetupFormProps) {
  return (
    <div className="max-w-md w-full">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 shadow-gray-200/50">
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Exam Setup</h2>
          <p className="text-gray-500 mb-8">Configure your simulated exam environment.</p>
        </div>

        <div className="space-y-8">
          {/* Exam Type Selection */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2 font-black">
              Exam Type
            </label>
            {fetchingFilters ? (
              <div className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 animate-pulse text-gray-400 text-sm">
                Loading exams...
              </div>
            ) : (
              <select
                className={`w-full p-4 rounded-xl border-2 ${
                  error ? 'border-red-500 bg-red-50' : 'border-gray-50 bg-gray-50'
                } font-bold text-gray-700 focus:border-blue-500 focus:bg-white outline-none transition-all cursor-pointer`}
                value={config.examType}
                onChange={(e) => setConfig({ ...config, examType: e.target.value })}
              >
                <option value="">-- Select Exam Type --</option>
                {examTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            )}
            {error && (
              <p className="text-red-500 text-xs mt-2 font-bold ml-1 animate-bounce">
                {error}
              </p>
            )}
          </div>

          {/* Question Count Slider */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="block text-xs font-bold uppercase text-gray-400 font-black">
                Number of Questions
              </label>
              <span className="text-3xl font-black text-blue-600 leading-none">
                {config.questionCount}
              </span>
            </div>

            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={config.questionCount}
              onChange={(e) =>
                setConfig({ ...config, questionCount: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all"
            />
          </div>

          {/* Time Summary Box */}
          <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-5">
            <div className="flex justify-between items-center">
              <span className="text-amber-800 font-bold text-sm uppercase tracking-tight">
                Total Time:
              </span>
              <span className="text-amber-900 font-black text-2xl">{timeLimit} min</span>
            </div>
            <p className="text-amber-700/70 text-[11px] mt-2 font-medium leading-tight italic">
              Note: The timer will start immediately and cannot be paused.
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={onStart}
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