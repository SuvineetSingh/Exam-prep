'use client';

interface ExamSetupFormProps {
  examTypes: string[];
  config: { examType: string; questionCount: number };
  setConfig: (config: any) => void;
  loading: boolean;
  fetchingFilters: boolean;
  error: string | null;
  onStart: () => void;
  timeLimit: number;
  availableCount: number;
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
  availableCount,
}: ExamSetupFormProps) {
  return (
    <div className="max-w-md w-full">
      <div className="card p-6 sm:p-8">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 mb-2">Exam Setup</h2>
          <p className="text-neutral-500 mb-8">Configure your simulated exam environment.</p>
        </div>

        <div className="space-y-8">
          {/* Exam Type Selection */}
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-400 mb-2">
              Exam Type
            </label>
            {fetchingFilters ? (
              <div className="w-full p-3 rounded-xl border border-neutral-200 bg-neutral-100 animate-pulse text-neutral-400 text-sm">
                Loading exams...
              </div>
            ) : (
              <select
                className={`input py-4 font-bold ${error ? 'border-red-500 bg-red-50' : ''}`}
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
              <p className="text-brand-coral text-xs mt-2 font-bold ml-1 animate-bounce">
                {error}
              </p>
            )}
          </div>

          {/* Question Count Slider */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="block text-xs font-bold uppercase text-neutral-400">
                Number of Questions
              </label>
              <span className="text-3xl font-black text-brand-green leading-none">
                {config.questionCount}
              </span>
            </div>

            <input
              type="range"
              min={Math.min(20, availableCount)}
              max={availableCount}
              step="5"
              value={config.questionCount}
              onChange={(e) =>
                setConfig({ ...config, questionCount: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-brand-green transition-all"
            />
            {config.examType && (
              <p className="text-xs text-neutral-400 mt-2">{availableCount} questions available for {config.examType}</p>
            )}
          </div>

          {/* Time Summary Box */}
          <div className="bg-amber-50 border-2 border-amber-100 rounded-card p-5">
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
            className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            {loading ? 'Initializing...' : 'Start Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}