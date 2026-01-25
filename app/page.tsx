import Link from 'next/link';
import { APP_CONFIG } from '@/lib/utils/constants';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            {APP_CONFIG.NAME}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Your comprehensive question bank for CPA, CFA, and FE exam
            preparation
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/login"
              className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
              aria-label="Sign up for Exam Prep Platform"
            >
              Get started
            </Link>
            <Link
              href="/about"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors"
              aria-label="Learn more about our platform"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
