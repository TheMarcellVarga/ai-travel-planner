import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { searchSkyscanner } from "@/lib/flights/skyscanner";
import { consumeRateLimit } from "@/lib/security/rate-limit";

const legSchema = z.object({ origin: z.string().regex(/^[A-Z]{3}$/), destination: z.string().regex(/^[A-Z]{3}$/), date: z.string().date() }).strict();
const requestSchema = z.object({ legs: z.array(legSchema).min(1).max(4) }).strict().superRefine(({ legs }, ctx) => {
  const today = new Date().toISOString().slice(0, 10);
  legs.forEach((leg, i) => {
    if (leg.date < today || leg.origin === leg.destination || (i > 0 && (leg.date < legs[i - 1].date || leg.origin !== legs[i - 1].destination))) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid itinerary", path: ["legs", i] });
  });
});
export async function POST(request: Request) {
  if (process.env.SKYSCANNER_ENABLED !== "true" || !process.env.SKYSCANNER_API_KEY) return NextResponse.json({ error: "Live flight search is not connected yet." }, { status: 503 });
  const limit = consumeRateLimit(request, { name: "flight-search", limit: 5, windowMs: 60_000 });
  if (!limit.allowed) return NextResponse.json({ error: "Too many searches. Try again shortly." }, { status: 429 });
  const user = await getCurrentUser();
  if (user?.authMode !== "supabase") return NextResponse.json({ error: "Sign in with a managed account to search flights." }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check your flight dates and route, then try again." }, { status: 400 });
  try {
    const result = await searchSkyscanner(parsed.data.legs, process.env.SKYSCANNER_API_KEY);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Flight search is unavailable right now. Try again later." }, { status: 502 }); }
}
