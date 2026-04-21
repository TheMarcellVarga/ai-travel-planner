import { NextResponse } from "next/server";

import { hasEmailEnv } from "@/lib/email";
import { hasSupabaseAdminEnv, hasSupabaseEnv, hasStripeEnv } from "@/lib/env";

export function GET() {
  const services = {
    auth: hasSupabaseEnv,
    database: hasSupabaseEnv,
    adminApi: hasSupabaseAdminEnv,
    billing: hasStripeEnv,
    email: hasEmailEnv()
  };
  const isCoreHealthy = services.auth && services.database;

  return NextResponse.json(
    {
      status: isCoreHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
