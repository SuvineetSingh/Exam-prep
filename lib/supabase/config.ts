export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const errorMessage =
      'Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.';
    
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error monitoring (Sentry/DataDog)
      console.error(errorMessage);
    }
    
    throw new Error(errorMessage);
  }

  return { url, anonKey };
}

/** Check if Supabase environment variables are configured (non-throwing) */
export function isSupabaseConfigValid(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
