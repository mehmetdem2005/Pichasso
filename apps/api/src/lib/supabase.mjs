import { createClient } from '@supabase/supabase-js';

export function createSupabaseAdminClient({ url, key }) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}
