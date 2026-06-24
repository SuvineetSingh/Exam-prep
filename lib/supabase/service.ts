import { createClient } from '@supabase/supabase-js';

/** Secret-key client — bypasses RLS. Only use in trusted server-side code (API routes, webhooks). */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
