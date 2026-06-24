import Link from 'next/link';

export function QuestionHeader() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
      <div>
        <h2 className="text-3xl font-bold text-neutral-900">Questions Browser</h2>
        <p className="text-neutral-500 mt-1">Select a mode to begin your study session.</p>
      </div>
      <div className="flex gap-3 w-full md:w-auto">
        <Link
          href="/practice"
          className="btn-primary flex-1 md:flex-none px-8 py-3 text-sm"
        >
          Practice Mode
        </Link>
        <Link
          href="/timed-exam"
          className="btn-secondary flex-1 md:flex-none px-8 py-3 text-sm"
        >
          Timed Exam
        </Link>
      </div>
    </div>
  );
}
