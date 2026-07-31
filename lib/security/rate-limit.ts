import { createHmac, randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import {
  emitOperationalEvent,
  type ObservedRoute
} from "@/lib/observability/operational-events";

type RateLimitPolicy = {
  name: string;
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

const MAX_BUCKETS = 10_000;
const buckets = new Map<string, RateLimitBucket>();
const processSalt =
  process.env.RATE_LIMIT_HASH_SECRET ?? randomBytes(32).toString("hex");

export const RATE_LIMIT_POLICIES = {
  tripPlanning: {
    name: "trip-planning",
    limit: 10,
    windowMs: 60_000
  },
  authInitiation: {
    name: "auth-initiation",
    limit: 5,
    windowMs: 10 * 60_000
  },
  newsletterSignup: {
    name: "newsletter-signup",
    limit: 3,
    windowMs: 60 * 60_000
  }
} satisfies Record<string, RateLimitPolicy>;

function getClientAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    forwardedFor ||
    "unknown-client"
  );
}

function getHashedClientKey(request: Request, policy: RateLimitPolicy) {
  return createHmac("sha256", processSalt)
    .update(`${policy.name}:${getClientAddress(request)}`)
    .digest("hex");
}

function pruneExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function consumeRateLimit(
  request: Request,
  policy: RateLimitPolicy,
  now = Date.now()
): RateLimitDecision {
  if (buckets.size >= MAX_BUCKETS) {
    pruneExpiredBuckets(now);
  }

  const clientKey =
    buckets.size < MAX_BUCKETS
      ? getHashedClientKey(request, policy)
      : `${policy.name}:overflow`;
  const existingBucket = buckets.get(clientKey);
  const bucket =
    !existingBucket || existingBucket.resetAt <= now
      ? { count: 0, resetAt: now + policy.windowMs }
      : existingBucket;

  bucket.count += 1;
  buckets.set(clientKey, bucket);

  return {
    allowed: bucket.count <= policy.limit,
    limit: policy.limit,
    remaining: Math.max(policy.limit - bucket.count, 0),
    resetAt: bucket.resetAt
  };
}

export function getRateLimitHeaders(
  decision: RateLimitDecision,
  now = Date.now()
) {
  const retryAfterSeconds = Math.max(
    Math.ceil((decision.resetAt - now) / 1_000),
    0
  );

  return {
    "RateLimit-Limit": String(decision.limit),
    "RateLimit-Remaining": String(decision.remaining),
    "RateLimit-Reset": String(Math.ceil(decision.resetAt / 1_000)),
    "Retry-After": String(retryAfterSeconds)
  };
}

export function createRateLimitResponse(
  decision: RateLimitDecision,
  options: { now?: number; route: ObservedRoute }
) {
  const now = options.now ?? Date.now();
  emitOperationalEvent("warn", "request.rate_limited", {
    route: options.route,
    status: 429,
    code: "RATE_LIMITED"
  });

  return NextResponse.json(
    {
      error: "Too many requests. Try again after the current limit window resets.",
      code: "RATE_LIMITED"
    },
    {
      status: 429,
      headers: getRateLimitHeaders(decision, now)
    }
  );
}

export function resetRateLimitsForTests() {
  buckets.clear();
}
