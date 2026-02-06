import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from './config';

// 1. Get the config once
const { url, anonKey } = getSupabaseConfig();

/**
 * Creates a Supabase client for use in browser/client components
 * This client automatically handles authentication state
 * @example
 * ```typescript
 * import { createClient } from '@/lib/supabase/client';
 * const supabase = createClient();
 * const { data, error } = await supabase.from('table').select();
 * ```
 */

/**
 * We create the client once outside the function. 
 * This ensures that throughout your app's lifecycle in the browser,
 * you are using the exact same instance.
 */
export const supabase = createBrowserClient(url, anonKey);


export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
