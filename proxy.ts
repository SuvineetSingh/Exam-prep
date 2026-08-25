import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase/config';

const PROTECTED = ['/questions', '/practice', '/timed-exam', '/dashboard', '/lobby', '/history', '/courses', '/settings', '/badges', '/checkout'];
const AUTH_ONLY = ['/login', '/register'];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Verifies the JWT with Supabase (not just cookie presence) and refreshes
  // it if close to expiry, writing the refreshed cookie back onto `response`.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (PROTECTED.some((r) => pathname.startsWith(r)) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.searchParams.delete('redirectedFrom');
    return NextResponse.redirect(redirectUrl);
  }

  if (AUTH_ONLY.includes(pathname) && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/courses';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets, images, and API routes — only run on page routes
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
