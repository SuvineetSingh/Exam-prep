import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

/**
 * Middleware runs before every request
 * Used here to refresh Supabase authentication sessions
 */
export async function middleware(request: NextRequest) {
  // Update Supabase session
  return await updateSession(request);
}

/**
 * Configure which routes should run middleware
 * Match all routes except static files and API routes that don't need auth
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
