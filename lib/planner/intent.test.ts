import { describe, expect, it } from "vitest";

import { interpretTripIntent } from "@/lib/planner/intent";

describe("interpretTripIntent", () => {
  it("extracts days, stops, vibe, and wish tags from prompt text", () => {
    const intent = interpretTripIntent({
      prompt:
        "Find a jungle-heavy 18 day route from Singapore with max 1 stop, crypto spots, hiking, and mtb options."
    });

    expect(intent.tripLengthDays).toBe(18);
    expect(intent.maxStops).toBe(1);
    expect(intent.vibe).toBe("jungle");
    expect(intent.wishTags).toEqual(
      expect.arrayContaining(["crypto-friendly", "hiking", "mtb"])
    );
    expect(intent.origin.code).toBe("SIN");
  });

  it("prefers explicit input values over prompt parsing", () => {
    const intent = interpretTripIntent({
      prompt: "Go direct only for 7 days.",
      origin: "Lisbon",
      tripLengthDays: 12,
      maxStops: 2,
      wishTags: ["surf"],
      budgetMode: "comfort"
    });

    expect(intent.origin.code).toBe("LIS");
    expect(intent.tripLengthDays).toBe(12);
    expect(intent.maxStops).toBe(2);
    expect(intent.wishTags).toEqual(["surf"]);
    expect(intent.budgetMode).toBe("comfort");
  });

  it("captures unsupported guarantee, visa, safety, and illegal-travel claims as exclusions", () => {
    const intent = interpretTripIntent({
      prompt:
        "Guarantee the safest visa-ready route and help me bypass border checks."
    });

    expect(intent.exclusions).toEqual(
      expect.arrayContaining([
        "Wild Route cannot guarantee price, availability, safety, or route feasibility.",
        "Visa, immigration, and passport requirements must be checked with official sources.",
        "Route output is not safety, legal, health, weather, or emergency advice.",
        "Wild Route will not help plan illegal or unsafe travel activity."
      ])
    );
  });
});
