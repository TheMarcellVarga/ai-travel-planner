import { getAccountExportForUser } from "@/lib/account/profile";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.authMode !== "supabase") {
    return new Response(JSON.stringify({ error: "Sign in with a real account first." }), {
      status: 401,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return new Response(JSON.stringify({ error: "Supabase is not configured." }), {
      status: 503,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  const payload = await getAccountExportForUser(supabase, user.id);

  return new Response(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email
        },
        ...payload
      },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="wild-route-account-${user.id}.json"`,
        "Cache-Control": "no-store"
      }
    }
  );
}
