import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env, hasSupabaseEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  if (!hasSupabaseEnv) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl!, env.supabasePublishableKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Parameters<typeof cookieStore.set>[2];
        }>
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      }
    }
  });
}
