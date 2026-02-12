import Link from 'next/link';
import { APP_CONFIG } from '@/lib/utils/constants';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="relative isolate min-h-screen bg-white flex flex-col">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 font-bold text-xl tracking-tight text-blue-600">
              {APP_CONFIG.NAME}
            </Link>
          </div>
          <div className="flex flex-1 justify-end gap-x-6 items-center">
            <Link
              href="/login"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-all"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative flex-1 pt-14">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#0070f3] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>

        <div className="py-24 sm:py-32 lg:pb-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Master Your Professional Exams
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                The most comprehensive question bank for{' '}
                <span className="font-semibold text-blue-600">CPA, CFA, and FE</span> candidates.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/signup"
                  className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-blue-500 hover:-translate-y-0.5 transition-all"
                >
                  Start Practicing Now
                </Link>
                <Link
                  href="/about"
                  className="text-sm font-semibold leading-6 text-gray-900 group"
                  aria-label="Learn more about our platform"
                >
                  Learn more{' '}
                  <span className="inline-block transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
