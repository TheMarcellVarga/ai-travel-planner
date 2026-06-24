import { beforeEach, describe, expect, it } from "vitest";

import { createTripGeneration } from "@/lib/planner/generate-routes";
import { interpretTripIntent } from "@/lib/planner/intent";
import {
  getSavedRoutesForUser,
  getGenerationCountForUser,
  getRouteForUserOrPublic,
  getPublicSharedRoute,
  getSharedRoute,
  getNewsletterSubscriber,
  publishRouteForUser,
  subscribeNewsletter,
  recordHandoff,
  resetStore,
  saveGeneration,
  saveRouteForUser
} from "@/lib/store/demo-store";

describe("demo store", () => {
  beforeEach(() => {
    resetStore();
  });

  it("saves a route for a user and exposes it through the user vault", () => {
    const generation = saveGeneration(
      createTripGeneration(
        interpretTripIntent({
          prompt: "Crypto and hiking route from Singapore.",
          origin: "Singapore",
          wishTags: ["crypto-friendly", "hiking"]
        })
      )
    );
    const routeId = generation.routes[0]!.id;

    const saved = saveRouteForUser("demo:user", routeId);

    expect(saved).not.toBeNull();
    expect(getSavedRoutesForUser("demo:user")).toHaveLength(1);
  });

  it("allows a signed-in demo user to save an anonymous exploration route", () => {
    const generation = saveGeneration(
      createTripGeneration(
        interpretTripIntent({
          prompt: "Jungle route from Singapore.",
          origin: "Singapore",
          wishTags: ["hiking"]
        })
      )
    );
    const routeId = generation.routes[0]!.id;

    const saved = saveRouteForUser("demo:new-user", routeId);

    expect(saved?.route.id).toBe(routeId);
    expect(getSavedRoutesForUser("demo:new-user")).toHaveLength(1);
  });

  it("does not let one demo user save another user's private generated route", () => {
    const generation = saveGeneration(
      createTripGeneration(
        interpretTripIntent({
          prompt: "Private hiking route from Singapore.",
          origin: "Singapore",
          wishTags: ["hiking"]
        })
      ),
      "demo:user-a"
    );
    const routeId = generation.routes[0]!.id;

    const saved = saveRouteForUser("demo:user-b", routeId);

    expect(saved).toBeNull();
    expect(getSavedRoutesForUser("demo:user-b")).toHaveLength(0);
  });

  it("counts generated routes by demo user for entitlement checks", () => {
    const firstGeneration = createTripGeneration(
      interpretTripIntent({
        prompt: "Crypto and hiking route from Singapore.",
        origin: "Singapore",
        wishTags: ["crypto-friendly", "hiking"]
      })
    );
    const secondGeneration = createTripGeneration(
      interpretTripIntent({
        prompt: "Surf route from Sydney.",
        origin: "Sydney",
        wishTags: ["surf"]
      })
    );

    saveGeneration(firstGeneration, "demo:user-a");
    saveGeneration(secondGeneration, "demo:user-b");

    expect(getGenerationCountForUser("demo:user-a")).toBe(1);
    expect(getGenerationCountForUser("demo:user-b")).toBe(1);
    expect(getGenerationCountForUser("demo:missing")).toBe(0);
  });

  it("publishes a stable shared snapshot for a route", () => {
    const generation = saveGeneration(
      createTripGeneration(
        interpretTripIntent({
          prompt: "Mountain-heavy route from Lisbon.",
          origin: "Lisbon",
          wishTags: ["hiking", "mtb"]
        })
      )
    );
    const routeId = generation.routes[0]!.id;

    const shared = publishRouteForUser("demo:user", routeId);

    expect(shared).not.toBeNull();
    expect(getSharedRoute(shared!.slug)?.route.id).toBe(routeId);
  });

  it("exposes only a whitelisted public shared route snapshot", () => {
    const generation = saveGeneration(
      createTripGeneration(
        interpretTripIntent({
          prompt: "Mountain-heavy route from Lisbon.",
          origin: "Lisbon",
          wishTags: ["hiking", "mtb"]
        })
      )
    );
    const route = generation.routes[0]! as typeof generation.routes[number] & {
      internalProviderPayload?: { billingId: string };
    };
    route.internalProviderPayload = { billingId: "cus_private" };
    route.bookingLinks[0] = {
      ...route.bookingLinks[0]!,
      rawProviderPayload: { token: "secret" }
    } as typeof route.bookingLinks[number] & { rawProviderPayload: { token: string } };
    route.stops[1] = {
      ...route.stops[1]!,
      privateNote: "traveler@example.com"
    } as typeof route.stops[number] & { privateNote: string };

    const shared = publishRouteForUser("demo:user", route.id);
    const publicShare = getPublicSharedRoute(shared!.slug);

    expect(publicShare).not.toBeNull();
    expect(JSON.stringify(publicShare)).not.toContain("cus_private");
    expect(JSON.stringify(publicShare)).not.toContain("secret");
    expect(JSON.stringify(publicShare)).not.toContain("traveler@example.com");
    expect(publicShare).not.toHaveProperty("userId");
    expect(publicShare).not.toHaveProperty("generationId");
    expect(publicShare!.route).not.toHaveProperty("bookingLinks");
  });

  it("does not let one demo user publish another user's private generated route", () => {
    const generation = saveGeneration(
      createTripGeneration(
        interpretTripIntent({
          prompt: "Private surf route from Sydney.",
          origin: "Sydney",
          wishTags: ["surf"]
        })
      ),
      "demo:user-a"
    );
    const routeId = generation.routes[0]!.id;

    expect(publishRouteForUser("demo:user-b", routeId)).toBeNull();
  });

  it("resolves handoff routes only for owners or public shared snapshots", () => {
    const generation = saveGeneration(
      createTripGeneration(
        interpretTripIntent({
          prompt: "Private mountain route from Lisbon.",
          origin: "Lisbon",
          wishTags: ["hiking", "mtb"]
        })
      ),
      "demo:user-a"
    );
    const route = generation.routes[0]!;

    expect(getRouteForUserOrPublic(route.id, "demo:user-b")).toBeNull();
    expect(getRouteForUserOrPublic(route.id, null)).toBeNull();

    const shared = publishRouteForUser("demo:user-a", route.id);

    expect(shared).not.toBeNull();
    expect(getRouteForUserOrPublic(route.id, "demo:user-b")?.route.id).toBe(route.id);
    expect(getRouteForUserOrPublic(route.id, null)?.route.id).toBe(route.id);
  });

  it("records booking handoffs without mutating route data", () => {
    const generation = saveGeneration(
      createTripGeneration(
        interpretTripIntent({
          prompt: "Surf-focused route from Sydney.",
          origin: "Sydney",
          wishTags: ["surf"]
        })
      )
    );
    const route = generation.routes[0]!;

    const handoff = recordHandoff(route.id, "demo:user", route.bookingLinks);

    expect(handoff.routeId).toBe(route.id);
    expect(handoff.links).toHaveLength(route.bookingLinks.length);
  });

  it("stores newsletter subscribers and merges topics by email", () => {
    const first = subscribeNewsletter({
      email: "reader@example.com",
      name: "Reader",
      topics: ["newsletter"]
    });

    const second = subscribeNewsletter({
      email: "reader@example.com",
      topics: ["route_notifications"]
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.subscriber.topics).toEqual(["newsletter", "route_notifications"]);
    expect(getNewsletterSubscriber("reader@example.com")?.topics).toEqual([
      "newsletter",
      "route_notifications"
    ]);
  });
});
