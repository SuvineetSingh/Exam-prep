'use client';

interface PracticeSetupFormProps {
  examFilter: string;
  setExamFilter: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  options: {
    examTypes: string[];
    categories: string[];
  };
  onStart: () => void;
  loading: boolean;
  examError: boolean;
}

export function PracticeSetupForm({
  examFilter, setExamFilter,
  categoryFilter, setCategoryFilter,
  options,
  onStart,
  loading,
  examError,
}: PracticeSetupFormProps) {
  const examSelected = examFilter !== 'all' && examFilter !== '';

  return (
    <div className="space-y-6">
      {/* Exam Type */}
      <div>
        <label className="block text-xs font-bold uppercase text-gray-400 mb-2 ml-1">
          Exam Type <span className="text-red-500">*</span>
        </label>
        <select
          value={examFilter}
          onChange={(e) => {
            setExamFilter(e.target.value);
            setCategoryFilter('all'); // reset category when exam changes
          }}
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

      {/* Category — disabled until exam is chosen */}
      <div>
        <label className={`block text-xs font-bold uppercase mb-2 ml-1 transition-colors ${
          examSelected ? 'text-gray-400' : 'text-gray-300'
        }`}>
          Category
        </label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          disabled={!examSelected}
          className={`w-full border rounded-2xl p-4 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all ${
            examSelected
              ? 'border-gray-200 cursor-pointer'
              : 'border-gray-100 text-gray-300 cursor-not-allowed opacity-60'
          }`}
        >
          <option value="all">
            {examSelected ? 'All Categories' : 'Select an exam type first'}
          </option>
          {examSelected &&
            options.categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
        </select>
        {!examSelected && (
          <p className="mt-2 ml-1 text-xs text-gray-400">
            Choose an exam type above to unlock categories.
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