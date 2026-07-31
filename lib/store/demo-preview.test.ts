import { describe, expect, it } from "vitest";

import { interpretTripIntent } from "@/lib/planner/intent";
import { planTrip } from "@/lib/planner/plan-trip";
import {
  DEMO_BROWSER_VAULT_KEY,
  readDemoBrowserVault,
  readDemoBrowserShares,
  saveDemoShareToBrowser,
  saveDemoRouteToBrowser
} from "@/lib/store/demo-browser-vault";
import { createDemoShareSlug, resolveDemoShare } from "@/lib/store/demo-preview";

async function createFixture() {
  const intent = interpretTripIntent({
    prompt: "A 12 day jungle route from Singapore with hiking.",
    origin: "Singapore",
    tripLengthDays: 12,
    maxStops: 1,
    wishTags: ["hiking"],
    budgetMode: "balanced"
  });
  const generation = await planTrip(intent);
  return { intent, route: generation.routes[0] };
}

describe("serverless-safe demo previews", () => {
  it("reconstructs a validated public route without process memory", async () => {
    const { intent, route } = await createFixture();
    const slug = createDemoShareSlug(intent, route);
    const resolved = await resolveDemoShare(slug);

    expect(slug).toMatch(/^preview-/);
    expect(Buffer.from(slug.replace(/^preview-/, ""), "base64url").toString("utf8"))
      .not.toContain(intent.prompt);
    expect(resolved?.route.promotedStopId).toBe(route.promotedStopId);
    expect(resolved?.publicRoute.route.bookingLinks).toBeUndefined();
  });

  it("rejects malformed preview tokens", async () => {
    expect(await resolveDemoShare("preview-not-valid-base64")).toBeNull();
    expect(await resolveDemoShare("ordinary-share-slug")).toBeNull();
  });

  it("deduplicates routes stored in the browser vault", async () => {
    const { route } = await createFixture();
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value)
    };

    saveDemoRouteToBrowser(storage, route);
    saveDemoRouteToBrowser(storage, route);

    expect(readDemoBrowserVault(storage)).toHaveLength(1);
    expect(values.has(DEMO_BROWSER_VAULT_KEY)).toBe(true);

    saveDemoShareToBrowser(storage, route, "/share/preview-valid");
    saveDemoShareToBrowser(storage, route, "/share/preview-valid");
    expect(readDemoBrowserShares(storage)).toEqual([
      expect.objectContaining({
        id: route.id,
        shareUrl: "/share/preview-valid"
      })
    ]);
  });
});
