import { createClient } from "@supabase/supabase-js";

import { env, hasSupabaseAdminEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  if (!hasSupabaseAdminEnv) {
    return null;
  }

  return createClient(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
