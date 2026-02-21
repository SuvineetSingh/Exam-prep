interface FilterProps {
  examType: string;
  setExamType: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  difficulty: string;
  setDifficulty: (val: string) => void;
  options: {
    examTypes: string[];
    categories: string[];
    difficulties: string[];
  };
  totalCount: number;
}

export function QuestionFilters({
  examType, setExamType,
  category, setCategory,
  difficulty, setDifficulty,
  options,
  totalCount
}: FilterProps) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap items-center gap-6 mb-8">
      <div className="flex-1 min-w-[150px]">
        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 ml-1">Exam Type</label>
        <select 
          value={examType} 
          onChange={(e) => setExamType(e.target.value)}
          className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
        >
          <option value="all">All Exams</option>
          {options.examTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 ml-1">Category</label>
        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
        >
          <option value="all">All Categories</option>
          {options.categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 ml-1">Difficulty</label>
        <select 
          value={difficulty} 
          onChange={(e) => setDifficulty(e.target.value)}
          className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
        >
          <option value="all">All Levels</option>
          {options.difficulties.map((diff) => (
            <option key={diff} value={diff} className="capitalize">{diff}</option>
          ))}
        </select>
      </div>

      <div className="pt-4">
         <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            {totalCount} Questions Found
         </span>
      </div>
    </div>
  );
}