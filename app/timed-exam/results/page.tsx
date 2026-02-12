import Link from 'next/link';

export default function ExamResultsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">Exam Submitted</h1>
        <p className="text-gray-500 mb-10 leading-relaxed">
          Your exam has been submitted successfully. Detailed results and scoring will be available in a future update.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/timed-exam"
            className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all"
          >
            Take Another Exam
          </Link>
          <Link
            href="/questions"
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
          >
            Back to Questions
          </Link>
        </div>
      </div>
    </div>
  );
}
