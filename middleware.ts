import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED = ['/questions', '/practice', '/timed-exam', '/dashboard', '/lobby', '/history', '/courses', '/settings', '/badges', '/checkout'];
const AUTH_ONLY = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Detect a Supabase session purely from cookies — no network call, no timeout.
  // Pages individually call supabase.auth.getUser() to fully verify the JWT.
  const hasSession = request.cookies.getAll().some(
    (c) => c.name.includes('-auth-token') && !c.name.endsWith('-code-verifier') && c.value.length > 0
  );

  if (PROTECTED.some((r) => pathname.startsWith(r)) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_ONLY.includes(pathname) && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/courses';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip static assets, images, and API routes — only run on page routes
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
