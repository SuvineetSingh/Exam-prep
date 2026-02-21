interface QuestionCardProps {
  question: {
    id: number;
    exam_type: string;
    category: string;
    difficulty: string;
    question_text: string;
  };
}

export function QuestionCard({ question: q }: QuestionCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-md shadow-sm">
          {q.exam_type}
        </span>
        <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase rounded-md">
          {q.category}
        </span>
        <span className={`ml-auto text-[10px] font-black uppercase px-2 py-1 rounded ${
          q.difficulty === 'hard' ? 'text-red-600 bg-red-50' : 
          q.difficulty === 'medium' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
        }`}>
          {q.difficulty}
        </span>
      </div>
      <p className="text-gray-800 text-lg font-semibold leading-snug group-hover:text-blue-900 transition-colors">
        {q.question_text}
      </p>
    </div>
  );
}