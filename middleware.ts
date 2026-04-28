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
     * Only run middleware on page routes — skip:
     * - _next/static / _next/image (assets)
     * - favicon and public images
     * - /api/* routes (they handle auth themselves and don't need session refresh)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
