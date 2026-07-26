import { beforeEach, describe, expect, it, vi } from "vitest";

import { FREE_ENTITLEMENT } from "@/lib/account/entitlements";
import { getCurrentUser } from "@/lib/auth";
import { createTripGeneration } from "@/lib/planner/generate-routes";
import { interpretTripIntent } from "@/lib/planner/intent";
import { resetStore, saveGeneration } from "@/lib/store/demo-store";
import {
  getGenerationCountForUserFromDatabase,
  saveGenerationToDatabase
} from "@/lib/store/persistent-store";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(async () => null)
}));

vi.mock("@/lib/store/persistent-store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/store/persistent-store")>(
    "@/lib/store/persistent-store"
  );

  return {
    ...actual,
    getGenerationCountForUserFromDatabase: vi.fn(async () => null),
    getGenerationFromDatabase: vi.fn(async () => null),
    saveGenerationToDatabase: vi.fn(async () => null)
  };
});

describe("trip planning API", () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    vi.mocked(getGenerationCountForUserFromDatabase).mockResolvedValue(null);
    vi.mocked(saveGenerationToDatabase).mockResolvedValue(null);
  });

  it("returns a controlled validation error for invalid planning input", async () => {
    const { POST } = await import("@/app/api/trips/plan/route");
    const response = await POST(
      new Request("http://localhost/api/trips/plan", {
        method: "POST",
        body: JSON.stringify({ prompt: "", tripLengthDays: 2 }),
        headers: { "Content-Type": "application/json" }
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid trip planning request.");
  });

  it("returns routes with estimate, persistence, and external-search metadata", async () => {
    const { POST } = await import("@/app/api/trips/plan/route");
    const response = await POST(
      new Request("http://localhost/api/trips/plan", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Find a 12 day hiking route from Singapore with max 1 stop.",
          origin: "Singapore",
          tripLengthDays: 12,
          maxStops: 1,
          wishTags: ["hiking"],
          budgetMode: "balanced"
        }),
        headers: { "Content-Type": "application/json" }
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.generationId).toMatch(/^generation_/);
    expect(payload.persistence).toMatchObject({
      mode: "memory",
      durable: false
    });
    expect(payload.entitlement).toMatchObject({
      plan: "free",
      generationLimit: FREE_ENTITLEMENT.generationLimit
    });
    expect(payload.usage).toMatchObject({
      used: 1,
      remaining: FREE_ENTITLEMENT.generationLimit - 1,
      allowed: true
    });
    expect(payload.tripIntent.origin.code).toBe("SIN");
    expect(payload.routes).toHaveLength(4);
    expect(payload.routes[0]).toMatchObject({
      estimateStatus: "planning_estimate",
      availabilityStatus: "external_search_required",
      dataSource: {
        providerId: "wild-route-destination-fixtures",
        mode: "fixture",
        status: "fixture"
      }
    });
    expect(payload.routes[0].bookingLinks[0]).toMatchObject({
      status: "external_search"
    });
  });

  it("can retrieve a memory-backed generation by id", async () => {
    const { POST } = await import("@/app/api/trips/plan/route");
    const createResponse = await POST(
      new Request("http://localhost/api/trips/plan", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Find a direct only surf route from Sydney.",
          origin: "Sydney",
          tripLengthDays: 7,
          maxStops: 0,
          wishTags: ["surf"],
          budgetMode: "value"
        }),
        headers: { "Content-Type": "application/json" }
      })
    );
    const created = await createResponse.json();

    const { GET } = await import("@/app/api/trips/[generationId]/route");
    const getResponse = await GET(new Request("http://localhost/api/trips/id"), {
      params: Promise.resolve({ generationId: created.generationId })
    });
    const fetched = await getResponse.json();

    expect(getResponse.status).toBe(200);
    expect(fetched.id).toBe(created.generationId);
    expect(fetched.persistence.mode).toBe("memory");
    fetched.routes.forEach((route: { stops: unknown[] }) => {
      expect(route.stops).toHaveLength(2);
    });
  });

  it("blocks anonymous planning after the free generation limit is used", async () => {
    for (let index = 0; index < FREE_ENTITLEMENT.generationLimit; index += 1) {
      saveGeneration(
        createTripGeneration(
          interpretTripIntent({
            prompt: `Anonymous route ${index}`,
            origin: "Singapore"
          })
        )
      );
    }

    const { POST } = await import("@/app/api/trips/plan/route");
    const response = await POST(
      new Request("http://localhost/api/trips/plan", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Find another route from Singapore.",
          origin: "Singapore"
        }),
        headers: { "Content-Type": "application/json" }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toMatchObject({
      code: "GENERATION_LIMIT_REACHED",
      entitlement: {
        plan: "free",
        generationLimit: FREE_ENTITLEMENT.generationLimit
      },
      usage: {
        used: FREE_ENTITLEMENT.generationLimit,
        remaining: 0,
        allowed: false
      }
    });
    expect(saveGenerationToDatabase).not.toHaveBeenCalled();
  });

  it("checks persisted generation counts for Supabase users before planning", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user_123",
      email: "traveler@example.com",
      name: "Traveler",
      authMode: "supabase",
      entitlement: FREE_ENTITLEMENT,
      profile: null
    });
    vi.mocked(getGenerationCountForUserFromDatabase).mockResolvedValue(
      FREE_ENTITLEMENT.generationLimit
    );

    const { POST } = await import("@/app/api/trips/plan/route");
    const response = await POST(
      new Request("http://localhost/api/trips/plan", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Find a hiking route from Singapore.",
          origin: "Singapore"
        }),
        headers: { "Content-Type": "application/json" }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.code).toBe("GENERATION_LIMIT_REACHED");
    expect(getGenerationCountForUserFromDatabase).toHaveBeenCalledWith("user_123");
    expect(saveGenerationToDatabase).not.toHaveBeenCalled();
  });
});
