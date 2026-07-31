import { NextResponse } from "next/server";
import { z } from "zod";

import { FREE_ENTITLEMENT, getGenerationLimitStatus } from "@/lib/account/entitlements";
import { getCurrentUser } from "@/lib/auth";
import { interpretTripIntent } from "@/lib/planner/intent";
import { planTrip } from "@/lib/planner/plan-trip";
import {
  consumeRateLimit,
  createRateLimitResponse,
  RATE_LIMIT_POLICIES
} from "@/lib/security/rate-limit";
import {
  ANONYMOUS_GENERATION_USER_ID,
  getGenerationCountForUser,
  saveGeneration
} from "@/lib/store/demo-store";
import { DATABASE_PERSISTENCE, MEMORY_PERSISTENCE } from "@/lib/store/persistence";
import {
  getGenerationCountForUserFromDatabase,
  saveGenerationToDatabase
} from "@/lib/store/persistent-store";

const requestSchema = z.object({
  prompt: z.string().min(1),
  origin: z.string().optional(),
  tripLengthDays: z.coerce.number().min(4).max(30).optional(),
  maxStops: z.coerce.number().min(0).max(2).optional(),
  wishTags: z.array(z.string()).optional(),
  budgetMode: z.enum(["value", "balanced", "comfort"]).optional()
});

async function getUsedGenerationCount(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  const memoryUserId = user?.id ?? ANONYMOUS_GENERATION_USER_ID;
  const memoryCount = getGenerationCountForUser(memoryUserId);

  if (user?.authMode !== "supabase") {
    return memoryCount;
  }

  const persistedCount = await getGenerationCountForUserFromDatabase(user.id);
  return (persistedCount ?? 0) + memoryCount;
}

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit(request, RATE_LIMIT_POLICIES.tripPlanning);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit);
  }

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid trip planning request.",
        details: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const tripIntent = interpretTripIntent(payload);
  const user = await getCurrentUser();
  const entitlement = user?.entitlement ?? FREE_ENTITLEMENT;
  const currentUsage = getGenerationLimitStatus(
    entitlement,
    await getUsedGenerationCount(user)
  );

  if (!currentUsage.allowed) {
    return NextResponse.json(
      {
        error: user
          ? "Your route generation limit is reached for this cycle."
          : "Anonymous planning has reached the free route generation limit for this session.",
        code: "GENERATION_LIMIT_REACHED",
        entitlement: {
          plan: entitlement.plan,
          generationLimit: entitlement.generationLimit
        },
        usage: currentUsage
      },
      { status: 403 }
    );
  }

  const candidateGeneration = await planTrip(tripIntent);
  const persistedGeneration = await saveGenerationToDatabase(candidateGeneration, user?.id);
  const generation =
    persistedGeneration ??
    saveGeneration(candidateGeneration, user?.id ?? ANONYMOUS_GENERATION_USER_ID);
  const persistence = persistedGeneration ? DATABASE_PERSISTENCE : MEMORY_PERSISTENCE;
  const usage = getGenerationLimitStatus(entitlement, currentUsage.used + 1);

  return NextResponse.json({
    generationId: generation.id,
    tripIntent: generation.tripIntent,
    routes: generation.routes,
    entitlement: {
      plan: entitlement.plan,
      generationLimit: entitlement.generationLimit
    },
    usage,
    persistence
  });
}
