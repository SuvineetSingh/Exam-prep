import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from './config';

/**
 * Creates a Supabase client for use in Server Components
 * This client handles authentication via cookies
 * 
 * @example
 * ```typescript
 * import { createClient } from '@/lib/supabase/server';
 * const supabase = await createClient();
 * const { data } = await supabase.from('table').select();
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
          console.error('Error setting cookies:', error);
        }
      },
    },
  });
}
