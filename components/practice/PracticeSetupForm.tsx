'use client';

interface PracticeSetupFormProps {
  examFilter: string;
  setExamFilter: (val: string) => void;
  options: { examTypes: string[] };
  onStart: () => void;
  loading: boolean;
  examError: boolean;
}

export function PracticeSetupForm({
  examFilter,
  setExamFilter,
  options,
  onStart,
  loading,
  examError,
}: PracticeSetupFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-bold uppercase text-gray-400 mb-2 ml-1">
          Exam Type <span className="text-red-500">*</span>
        </label>
        <select
          value={examFilter}
          onChange={(e) => setExamFilter(e.target.value)}
          className={`w-full border rounded-2xl p-4 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all cursor-pointer ${
            examError ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'
          }`}
        >
          <option value="all">Select an Exam Type...</option>
          {options.examTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {examError && (
          <p className="mt-2 ml-1 text-xs font-semibold text-red-500">
            Please select an exam type before starting.
          </p>
        )}
      </div>

      <button
        onClick={onStart}
        disabled={loading}
        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? 'Finding Question...' : 'Start Practice →'}
      </button>
    </div>
  );
}
