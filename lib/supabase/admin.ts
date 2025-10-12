import { createClient } from '@supabase/supabase-js'

/**
 * Admin client with service role key
 * Use this ONLY on server-side for admin operations
 * NEVER expose this client to the browser!
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

