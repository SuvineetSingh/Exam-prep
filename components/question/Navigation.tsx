import Link from 'next/link';

export function QuestionHeader() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Questions Browser</h2>
        <p className="text-gray-500 mt-1">Select a mode to begin your study session.</p>
      </div>
      <div className="flex gap-3 w-full md:w-auto">
        <Link
          href="/practice"
          className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 text-center"
        >
          Practice Mode
        </Link>
        <Link
          href="/timed-exam"
          className="flex-1 md:flex-none bg-white border-2 border-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95 text-center"
        >
          Timed Exam
        </Link>
      </div>
    </div>
  );
}
