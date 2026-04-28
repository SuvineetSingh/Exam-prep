import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigValid } from './config';
import type { Database } from '@/lib/types';

/**
 * Refreshes Supabase session and manages authentication cookies
 * Redirects unauthenticated users away from protected routes
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigValid()) {
    console.error('Supabase not configured in middleware');
    return supabaseResponse;
  }

  const { url, anonKey } = getSupabaseConfig();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // getSession() reads from the cookie — no network call, safe for Edge Runtime.
  // Individual server components/actions call getUser() to fully verify the JWT.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const protectedRoutes = ['/questions', '/practice', '/timed-exam', '/dashboard', '/lobby', '/history', '/courses', '/settings'];
  const authRoutes = ['/login', '/register'];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname);

  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
