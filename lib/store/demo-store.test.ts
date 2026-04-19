import { beforeEach, describe, expect, it } from "vitest";

import { createTripGeneration } from "@/lib/planner/generate-routes";
import { interpretTripIntent } from "@/lib/planner/intent";
import {
  getSavedRoutesForUser,
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
