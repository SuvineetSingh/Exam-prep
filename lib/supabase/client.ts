import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from './config';

/** Creates browser-side Supabase client with automatic auth state management */
export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
