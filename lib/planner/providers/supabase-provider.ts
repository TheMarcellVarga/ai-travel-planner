import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fixtureRouteDataProvider } from "@/lib/planner/providers/fixture-provider";
import type { WishTag } from "@/lib/types";
import type {
  RouteDataProvider,
  RouteProviderPayload
} from "@/lib/planner/providers/types";

const wishTagSchema = z.enum([
  "crypto-friendly",
  "animal-friendly",
  "hiking",
  "mtb",
  "surf"
]);

const destinationRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(2).max(4),
  country: z.string().min(1),
  region: z.string().min(1),
  lat: z.number().finite(),
  lng: z.number().finite(),
  scene: z.string().min(1),
  image_hint: z.string().min(1),
  base_cost_usd: z.number().int().nonnegative(),
  comfort_cost_usd: z.number().int().nonnegative(),
  crypto_friendly: z.boolean(),
  activity_score: z.coerce.number().min(0),
  created_at: z.string().datetime(),
  destination_tag_mappings: z.array(z.object({ tag: z.string() }))
});

function normalizedTags(rows: Array<{ tag: string }>): WishTag[] {
  return rows.flatMap(({ tag }) => {
    const parsed = wishTagSchema.safeParse(tag);
    return parsed.success ? [parsed.data] : [];
  });
}

export const supabaseRouteDataProvider: RouteDataProvider = {
  id: "wild-route-supabase-destinations",
  mode: "live",
  async load(): Promise<RouteProviderPayload> {
    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      throw new Error("Supabase destination catalog is not configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4_000);
    const { data, error } = await supabase
      .from("destinations")
      .select(
        "id, name, code, country, region, lat, lng, scene, image_hint, base_cost_usd, comfort_cost_usd, crypto_friendly, activity_score, created_at, destination_tag_mappings(tag)"
      )
      .abortSignal(controller.signal);
    clearTimeout(timeout);

    if (error || !data?.length) {
      throw new Error("Supabase destination catalog is unavailable or empty.");
    }

    const rows = z.array(destinationRowSchema).parse(data);
    const observedAt = rows.reduce(
      (latest, row) => (row.created_at > latest ? row.created_at : latest),
      rows[0].created_at
    );

    return {
      status: "available",
      freshness: {
        observedAt,
        maxAgeMinutes: null
      },
      assumptions: [
        "Destination facts were read from the configured Wild Route Supabase catalog.",
        "Catalog costs remain planning inputs; no flight or stay inventory was queried."
      ],
      destinations: rows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        country: row.country,
        region: row.region,
        coordinates: { lat: row.lat, lng: row.lng },
        tags: normalizedTags(row.destination_tag_mappings),
        scene: row.scene,
        imageHint: row.image_hint,
        baseCostUsd: row.base_cost_usd,
        comfortCostUsd: row.comfort_cost_usd,
        cryptoFriendly: row.crypto_friendly,
        activityScore: row.activity_score
      }))
    };
  }
};

export function getRouteDataProvider(): RouteDataProvider {
  if (process.env.ROUTE_DESTINATION_MODE === "fixture" || process.env.NODE_ENV === "test") {
    return fixtureRouteDataProvider;
  }

  return supabaseRouteDataProvider;
}
