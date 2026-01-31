import Link from 'next/link';

export function QuickActions() {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/questions"
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
        >
          Start Practice →
        </Link>
        <Link
          href="/questions"
          className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-lg border-2 border-gray-200 text-center transition-colors"
        >
          View All Questions →
        </Link>
      </div>
    </div>
  );
}
