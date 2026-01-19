import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from './config';

/**
 * Creates a Supabase client for use in browser/client components
 * This client automatically handles authentication state
 * 
 * @example
 * ```typescript
 * import { createClient } from '@/lib/supabase/client';
 * const supabase = createClient();
 * const { data, error } = await supabase.from('table').select();
 * ```
 */
export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
