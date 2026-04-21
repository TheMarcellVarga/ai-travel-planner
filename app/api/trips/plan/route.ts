import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { createTripGeneration } from "@/lib/planner/generate-routes";
import { interpretTripIntent } from "@/lib/planner/intent";
import { saveGeneration } from "@/lib/store/demo-store";
import { saveGenerationToDatabase } from "@/lib/store/persistent-store";

const requestSchema = z.object({
  prompt: z.string().min(1),
  origin: z.string().optional(),
  tripLengthDays: z.coerce.number().min(4).max(30).optional(),
  maxStops: z.coerce.number().min(0).max(2).optional(),
  wishTags: z.array(z.string()).optional(),
  budgetMode: z.enum(["value", "balanced", "comfort"]).optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = requestSchema.parse(body);
  const tripIntent = interpretTripIntent(payload);
  const user = await getCurrentUser();
  const candidateGeneration = createTripGeneration(tripIntent);
  const generation =
    (await saveGenerationToDatabase(candidateGeneration, user?.id)) ??
    saveGeneration(candidateGeneration);

  return NextResponse.json({
    generationId: generation.id,
    tripIntent: generation.tripIntent,
    routes: generation.routes
  });
}
