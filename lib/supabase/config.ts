export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    const errorMessage =
      'Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set.';

    if (process.env.NODE_ENV === 'production') {
      console.error(errorMessage);
    }

    throw new Error(errorMessage);
  }

  return { url, publishableKey };
}

/** Check if Supabase environment variables are configured (non-throwing) */
export function isSupabaseConfigValid(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
