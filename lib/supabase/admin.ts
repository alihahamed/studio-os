import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client with service_role key.
 * ONLY use in server-side API routes — never expose to the client.
 * Bypasses RLS for admin operations.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
