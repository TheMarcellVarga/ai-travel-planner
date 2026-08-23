import { z } from "zod";

import { planTrip } from "@/lib/planner/plan-trip";
import { tripIntentSchema } from "@/lib/planner/schema";
import { createPublicRouteSnapshot } from "@/lib/store/public-share";
import type { PublicSharedRoute, RouteOption, TripIntent } from "@/lib/types";

const DEMO_SHARE_PREFIX = "preview-";
const MAX_TOKEN_LENGTH = 2_500;

const demoShareRecipeSchema = z
  .object({
    version: z.literal(1),
    intent: tripIntentSchema.omit({ prompt: true }),
    promotedStopId: z.string().min(1).max(80),
    publishedAt: z.string().datetime()
  })
  .strict();

export function createDemoShareSlug(intent: TripIntent, route: RouteOption) {
  const recipe = demoShareRecipeSchema.parse({
    version: 1,
    intent: {
      origin: intent.origin,
      routeType:
        intent.routeType ?? (route.stops.at(-1)?.kind === "return" ? "round_trip" : "one_way"),
      tripLengthDays: intent.tripLengthDays,
      maxStops: intent.maxStops,
      wishTags: intent.wishTags,
      budgetMode: intent.budgetMode,
      vibe: intent.vibe,
      exclusions: intent.exclusions
    },
    promotedStopId: route.promotedStopId,
    publishedAt: new Date().toISOString()
  });
  const token = Buffer.from(JSON.stringify(recipe), "utf8").toString("base64url");

  if (token.length > MAX_TOKEN_LENGTH) {
    throw new Error("Demo share recipe is too large.");
  }

  return `${DEMO_SHARE_PREFIX}${token}`;
}

export async function resolveDemoShare(slug: string): Promise<{
  publicRoute: PublicSharedRoute;
  route: RouteOption;
} | null> {
  if (!slug.startsWith(DEMO_SHARE_PREFIX)) {
    return null;
  }

  const token = slug.slice(DEMO_SHARE_PREFIX.length);
  if (!token || token.length > MAX_TOKEN_LENGTH) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    const recipe = demoShareRecipeSchema.parse(decoded);
    const generation = await planTrip({
      ...recipe.intent,
      prompt: "Published demo route recipe."
    });
    const route = generation.routes.find(
      (candidate) => candidate.promotedStopId === recipe.promotedStopId
    );

    if (!route) {
      return null;
    }

    return {
      route,
      publicRoute: {
        id: `demo-share-${route.promotedStopId}`,
        slug,
        route: createPublicRouteSnapshot(route),
        publishedAt: recipe.publishedAt
      }
    };
  } catch {
    return null;
  }
}
