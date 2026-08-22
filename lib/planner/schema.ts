import { z } from "zod";

const wishTagSchema = z.enum([
  "crypto-friendly",
  "animal-friendly",
  "hiking",
  "mtb",
  "surf"
]);

const departureDateSchema = z
  .union([z.string().date(), z.string().datetime()])
  .nullable()
  .optional();

const coordinatesSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  })
    .strict();

const routeCostStatusSchema = z.enum(["planning_estimate", "provider_observed", "partial"]);

const routeCostBreakdownSchema = z
  .object({
    currency: z.literal("USD"),
    total: z.number().nonnegative(),
    transport: z
      .array(
        z
          .object({
            fromCode: z.string().min(2).max(4),
            toCode: z.string().min(2).max(4),
            amount: z.number().nonnegative(),
            status: routeCostStatusSchema,
            source: z.string().min(1),
            observedAt: z.string().datetime().nullable()
          })
          .strict()
      )
      .min(1),
    stays: z
      .array(
        z
          .object({
            stopId: z.string().min(1),
            nights: z.number().int().nonnegative(),
            amount: z.number().nonnegative(),
            status: routeCostStatusSchema
          })
          .strict()
      )
      .min(1),
    assumptions: z.array(z.string().min(1))
  })
  .strict();

const routeMediaAssetSchema = z
  .object({
    provider: z.enum(["wikimedia-commons", "openverse", "local-fallback"]),
    imageUrl: z.string().min(1),
    sourceUrl: z.string().url(),
    title: z.string().min(1),
    creator: z.string().min(1),
    licenseLabel: z.string().min(1),
    licenseUrl: z.string().url(),
    attributionText: z.string().min(1),
    fetchedAt: z.string().datetime()
  })
  .strict();

export const destinationProfileSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    code: z.string().min(2).max(4),
    country: z.string().min(1),
    region: z.string().min(1),
    coordinates: coordinatesSchema,
    tags: z.array(wishTagSchema),
    scene: z.string().min(1),
    imageHint: z.string().min(1),
    baseCostUsd: z.number().nonnegative(),
    comfortCostUsd: z.number().nonnegative(),
    cryptoFriendly: z.boolean(),
    activityScore: z.number().min(0).max(10)
  })
  .strict();

export const routeProviderPayloadSchema = z
  .object({
    status: z.enum(["fixture", "available", "partial", "unavailable"]),
    freshness: z
      .object({
        observedAt: z.string().datetime().nullable(),
        maxAgeMinutes: z.number().nonnegative().nullable()
      })
      .strict(),
    assumptions: z.array(z.string().min(1)),
    destinations: z.array(destinationProfileSchema).min(1)
  })
  .strict();

const routeDataSourceSchema = z
  .object({
    providerId: z.string().min(1),
    fallbackProviderId: z.string().min(1).nullable(),
    mode: z.enum(["fixture", "live"]),
    status: z.enum(["fixture", "available", "partial", "unavailable"]),
    checkedAt: z.string().datetime(),
    latencyMs: z.number().nonnegative(),
    freshness: routeProviderPayloadSchema.shape.freshness,
    assumptions: z.array(z.string().min(1))
  })
  .strict();

const routeStopSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    code: z.string().min(2).max(4),
    country: z.string().min(1),
    kind: z.enum(["origin", "destination"]),
    coordinates: coordinatesSchema,
    tags: z.array(wishTagSchema),
    scene: z.string().optional(),
    imageHint: z.string().optional(),
    media: routeMediaAssetSchema.nullable().optional()
  })
  .strict();

const bookingLinkSchema = z
  .object({
    id: z.string().min(1),
    provider: z.string().min(1),
    label: z.string().min(1),
    url: z.string().url(),
    kind: z.enum(["route", "leg", "stay"]),
    status: z.literal("external_search"),
    disclaimer: z.string().min(1)
  })
  .strict();

export const routeOptionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    tagline: z.string().min(1),
    vibe: z.string().min(1),
    promotedStopId: z.string().min(1),
    score: z.number(),
    confidence: z.number().min(0).max(1),
    estimatedCostUsd: z.number().nonnegative(),
    costBreakdown: routeCostBreakdownSchema,
    estimateStatus: z.literal("planning_estimate"),
    availabilityStatus: z.literal("external_search_required"),
    dataFreshness: z.string().min(1),
    dataSource: routeDataSourceSchema,
    disclaimer: z.string().min(1),
    reasons: z.array(z.string().min(1)).min(1),
    wishTags: z.array(wishTagSchema),
    stops: z.array(routeStopSchema).min(2),
    bookingLinks: z.array(bookingLinkSchema).min(1)
  })
  .strict();

export const tripIntentSchema = z
  .object({
    prompt: z.string().min(1),
    origin: z
      .object({
        label: z.string().min(1),
        code: z.string().min(2).max(4),
        coordinates: coordinatesSchema,
        country: z.string().min(1)
      })
      .strict(),
    tripLengthDays: z.number().int().min(4).max(30),
    maxStops: z.number().int().min(0).max(2),
    departureDate: departureDateSchema,
    wishTags: z.array(wishTagSchema),
    budgetMode: z.enum(["value", "balanced", "comfort"]),
    vibe: z.string().min(1),
    exclusions: z.array(z.string().min(1))
  })
  .strict();

export const tripGenerationSchema = z
  .object({
    id: z.string().min(1),
    createdAt: z.string().datetime(),
    tripIntent: tripIntentSchema,
    routes: z.array(routeOptionSchema).min(1).max(5),
    agentRun: z
      .object({
        mode: z.enum(["deterministic", "model"]),
        agentVersion: z.string().min(1),
        status: z.enum(["complete", "partial", "fallback"]),
        latencyMs: z.number().nonnegative(),
        modelId: z.string().min(1).optional()
      })
      .strict()
      .optional()
  })
  .strict();
