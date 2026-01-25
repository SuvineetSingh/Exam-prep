import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigValid } from './config';
import type { Database } from '@/lib/types';

/**
 * Middleware helper for Supabase authentication
 * Refreshes the user's session and sets cookies appropriately
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Check if Supabase is configured
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

  const {data: {user}, error} = await supabase.auth.getUser();

  if (error) {
    console.error('Error refreshing session:', error);
  }

  // Protect routes
  const protectedRoutes = ['/dashboard', '/settings', '/profile', '/questions'];
  const publicRoutes = ['/','/login', '/register'];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    // Redirect to login if accessing protected route without authentication
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  //If route is public and user is logged in, redirect to dashboard
  if (isPublicRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
