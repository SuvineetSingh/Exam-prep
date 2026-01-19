import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { APP_CONFIG } from '@/lib/utils/constants';
import { ErrorBoundary } from '@/components/error-boundary';

// Configure Inter font with Latin subset
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.NAME,
    template: `%s | ${APP_CONFIG.NAME}`,
  },
  description: APP_CONFIG.DESCRIPTION,
  keywords: ['CPA', 'CFA', 'FE', 'exam prep', 'question bank', 'practice tests'],
  authors: [{ name: 'Suvineet Singh' }],
  creator: 'Suvineet Singh',
  metadataBase: new URL(APP_CONFIG.URL),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: APP_CONFIG.NAME,
    title: APP_CONFIG.NAME,
    description: APP_CONFIG.DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_CONFIG.NAME,
    description: APP_CONFIG.DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
