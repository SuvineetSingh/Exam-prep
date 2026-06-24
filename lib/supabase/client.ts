import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from './config';

/** Creates browser-side Supabase client with automatic auth state management */
export function createClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createBrowserClient(url, publishableKey);
}
