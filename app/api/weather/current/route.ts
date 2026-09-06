import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentConditions } from "@/lib/travel-data/weather";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180)
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng")
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid weather coordinates." }, { status: 400 });
  }

  const conditions = await getCurrentConditions(parsed.data.lat, parsed.data.lng);
  if (!conditions) {
    return NextResponse.json(
      { error: "Current weather is temporarily unavailable." },
      { status: 503 }
    );
  }

  return NextResponse.json(conditions, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" }
  });
}
