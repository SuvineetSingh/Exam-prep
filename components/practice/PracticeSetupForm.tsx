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
        <label className="block text-xs font-bold uppercase text-neutral-400 mb-2 ml-1">
          Exam Type <span className="text-brand-coral">*</span>
        </label>
        <select
          value={examFilter}
          onChange={(e) => setExamFilter(e.target.value)}
          className={`input py-4 cursor-pointer ${
            examError ? 'border-red-400 ring-2 ring-red-200' : ''
          }`}
        >
          <option value="all">Select an Exam Type...</option>
          {options.examTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {examError && (
          <p className="mt-2 ml-1 text-xs font-semibold text-brand-coral">
            Please select an exam type before starting.
          </p>
        )}
      </div>

      <button
        onClick={onStart}
        disabled={loading}
        className="btn-primary w-full py-4 text-lg disabled:opacity-50"
      >
        {loading ? 'Finding Question...' : 'Start Practice →'}
      </button>
    </div>
  );
}
