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
}

export function PracticeSetupForm({
  examFilter, setExamFilter,
  categoryFilter, setCategoryFilter,
  options,
  onStart,
  loading
}: PracticeSetupFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-bold uppercase text-gray-400 mb-2 ml-1">
          Exam Type
        </label>
        <select 
          value={examFilter} 
          onChange={(e) => setExamFilter(e.target.value)}
          className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all cursor-pointer"
        >
          <option value="all">All Exams</option>
          {options.examTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-gray-400 mb-2 ml-1">
          Category
        </label>
        <select 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all cursor-pointer"
        >
          <option value="all">All Categories</option>
          {options.categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
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