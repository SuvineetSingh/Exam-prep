import type { Metadata, Viewport } from 'next'; // Added Viewport type
import { Inter, Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { APP_CONFIG } from '@/lib/utils/constants';
import { ErrorBoundary } from '@/components/error-boundary';
import { CartProvider } from '@/lib/cart/CartContext';

// 1. ADD THIS SECTION: This tells the mobile browser to match the screen width
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  display: 'swap',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.NAME,
    template: `%s | ${APP_CONFIG.NAME}`,
  },
  description: APP_CONFIG.DESCRIPTION,
  keywords: ['CMA', 'CFA', 'FE', 'exam prep', 'question bank', 'practice tests'],
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
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${plexMono.variable}`}>
      <body className="antialiased">
        <ErrorBoundary>
          <CartProvider>{children}</CartProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}