import { afterEach, describe, expect, it } from "vitest";

import {
  consumeRateLimit,
  createRateLimitResponse,
  getRateLimitHeaders,
  resetRateLimitsForTests
} from "@/lib/security/rate-limit";

const policy = {
  name: "test-policy",
  limit: 2,
  windowMs: 60_000
};

function requestFor(address: string) {
  return new Request("http://localhost/api/test", {
    headers: { "x-forwarded-for": `${address}, 10.0.0.1` }
  });
}

describe("rate limiting", () => {
  afterEach(() => {
    resetRateLimitsForTests();
  });

  it("allows requests up to the policy limit and returns retry metadata", () => {
    const now = Date.UTC(2026, 7, 1, 0, 0, 0);
    const request = requestFor("203.0.113.10");

    const first = consumeRateLimit(request, policy, now);
    const second = consumeRateLimit(request, policy, now + 1_000);
    const third = consumeRateLimit(request, policy, now + 2_000);

    expect(first).toMatchObject({ allowed: true, remaining: 1 });
    expect(second).toMatchObject({ allowed: true, remaining: 0 });
    expect(third).toMatchObject({ allowed: false, remaining: 0 });
    expect(getRateLimitHeaders(third, now + 2_000)).toEqual({
      "RateLimit-Limit": "2",
      "RateLimit-Remaining": "0",
      "RateLimit-Reset": String(Math.ceil((now + 60_000) / 1_000)),
      "Retry-After": "58"
    });
  });

  it("isolates clients without retaining their raw address", () => {
    const now = Date.UTC(2026, 7, 1, 0, 0, 0);

    consumeRateLimit(requestFor("203.0.113.10"), policy, now);
    consumeRateLimit(requestFor("203.0.113.10"), policy, now);

    expect(
      consumeRateLimit(requestFor("203.0.113.11"), policy, now)
    ).toMatchObject({ allowed: true, remaining: 1 });
  });

  it("starts a fresh bucket after the window expires", () => {
    const now = Date.UTC(2026, 7, 1, 0, 0, 0);
    const request = requestFor("203.0.113.10");

    consumeRateLimit(request, policy, now);
    consumeRateLimit(request, policy, now);

    expect(consumeRateLimit(request, policy, now + 60_001)).toMatchObject({
      allowed: true,
      remaining: 1
    });
  });

  it("returns a stable privacy-safe 429 response", async () => {
    const now = Date.UTC(2026, 7, 1, 0, 0, 0);
    const decision = {
      allowed: false,
      limit: 2,
      remaining: 0,
      resetAt: now + 60_000
    };
    const response = createRateLimitResponse(decision, now);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(await response.json()).toEqual({
      error: "Too many requests. Try again after the current limit window resets.",
      code: "RATE_LIMITED"
    });
  });
});
