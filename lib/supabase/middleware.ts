import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigValid } from './config';
import type { Database } from '@/lib/types';

/**
 * Refreshes Supabase session and manages authentication cookies
 * Route protection is currently disabled - see commented code below
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

  const { error } = await supabase.auth.getUser();

  // Only log real errors, not missing session (status 400)
  if (error && error.status !== 400) {
    console.error('Error refreshing session:', error);
  }

  /* ROUTE PROTECTION DISABLED
   * To enable: uncomment code below and update protectedRoutes array
   * Current setup allows unauthenticated access for simplified dashboard
   * 
  /*
  const protectedRoutes = ['/questions'];
  const publicRoutes = ['/', '/login', '/register'];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname === route
  );

  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isPublicRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/questions';
    return NextResponse.redirect(redirectUrl);
  }
  */

  return supabaseResponse;
}
