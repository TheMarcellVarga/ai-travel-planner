import { describe, expect, it } from "vitest";

import {
  createDefaultUserProfile,
  normalizeFullName,
  normalizeHomeAirportCode,
  normalizeUserProfileInput
} from "@/lib/account/profile";

describe("account profile helpers", () => {
  it("normalizes names and airport codes", () => {
    expect(normalizeFullName("  Ada   Lovelace  ")).toBe("Ada Lovelace");
    expect(normalizeHomeAirportCode(" sin ")).toBe("SIN");
    expect(normalizeHomeAirportCode("   ")).toBeNull();
  });

  it("creates a default durable profile shape", () => {
    expect(
      createDefaultUserProfile("user-1", {
        fullName: "Pilot"
      })
    ).toMatchObject({
      userId: "user-1",
      fullName: "Pilot",
      preferredCurrency: "USD",
      travelStyle: "balanced",
      newsletterOptIn: false,
      routeAlertsOptIn: false
    });
  });

  it("normalizes persisted profile input before storage", () => {
    expect(
      normalizeUserProfileInput({
        fullName: "  Grace   Hopper ",
        homeAirportCode: " jfk ",
        preferredCurrency: "USD",
        travelStyle: "luxury",
        newsletterOptIn: true,
        routeAlertsOptIn: false
      })
    ).toEqual({
      fullName: "Grace Hopper",
      homeAirportCode: "JFK",
      preferredCurrency: "USD",
      travelStyle: "luxury",
      newsletterOptIn: true,
      routeAlertsOptIn: false
    });
  });
});
