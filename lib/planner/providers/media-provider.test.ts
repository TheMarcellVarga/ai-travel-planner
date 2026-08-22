import { afterEach, describe, expect, it, vi } from "vitest";

import { destinations } from "@/lib/data/destinations";
import {
  enrichRoutesWithMedia,
  openRouteMediaProvider
} from "@/lib/planner/providers/media-provider";
import { createTripGeneration } from "@/lib/planner/generate-routes";
import { interpretTripIntent } from "@/lib/planner/intent";

const destination = destinations[0];

function mockJsonResponse(payload: unknown, ok = true) {
  return {
    ok,
    json: async () => payload
  } as Response;
}

describe("open route media provider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps Commons credit and license metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockJsonResponse({
          query: {
            pages: {
              "1": {
                title: "File:Bali rice terraces.jpg",
                imageinfo: [
                  {
                    thumburl: "https://upload.wikimedia.org/route-stop.jpg",
                    descriptionurl: "https://commons.wikimedia.org/wiki/File:Route_stop.jpg",
                    extmetadata: {
                      LicenseShortName: { value: "CC BY-SA 4.0" },
                      LicenseUrl: { value: "https://creativecommons.org/licenses/by-sa/4.0/" },
                      Artist: { value: "<b>Route Photographer</b>" }
                    }
                  }
                ]
              }
            }
          }
        })
      )
    );

    const asset = await openRouteMediaProvider.getMedia(destination);

    expect(asset).toMatchObject({
      provider: "wikimedia-commons",
      title: "Bali rice terraces.jpg",
      creator: "Route Photographer",
      licenseLabel: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
    });
    expect(asset.attributionText).toContain("Route Photographer");
  });

  it("skips NC and ND licenses before accepting an allowed asset", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        mockJsonResponse({
          query: {
            pages: {
              "1": {
                title: "File:Bali restricted.jpg",
                imageinfo: [
                  {
                    thumburl: "https://upload.wikimedia.org/restricted.jpg",
                    descriptionurl: "https://commons.wikimedia.org/wiki/File:Restricted.jpg",
                    extmetadata: { LicenseShortName: { value: "CC BY-NC-ND 4.0" } }
                  }
                ]
              },
              "2": {
                title: "File:Bali rice terraces.jpg",
                imageinfo: [
                  {
                    thumburl: "https://upload.wikimedia.org/allowed.jpg",
                    descriptionurl: "https://commons.wikimedia.org/wiki/File:Allowed.jpg",
                    extmetadata: { LicenseShortName: { value: "Public domain" } }
                  }
                ]
              }
            }
          }
        })
      )
    );

    const asset = await openRouteMediaProvider.getMedia(destination);

    expect(asset.provider).toBe("wikimedia-commons");
    expect(asset.title).toBe("Bali rice terraces.jpg");
    expect(asset.licenseLabel).toBe("Public domain");
  });

  it("rejects irrelevant document-like Commons results before accepting a place image", async () => {
    const capeTown = destinations.find((item) => item.id === "cape-town");
    expect(capeTown).toBeDefined();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockJsonResponse({
          query: {
            pages: {
              "1": {
                title: "File:Report upon the Colorado River.pdf",
                imageinfo: [
                  {
                    thumburl: "https://upload.wikimedia.org/report.jpg",
                    descriptionurl: "https://commons.wikimedia.org/wiki/File:Report.pdf",
                    extmetadata: {
                      LicenseShortName: { value: "Public domain" }
                    }
                  }
                ]
              },
              "2": {
                title: "File:Cape Town Table Mountain.jpg",
                imageinfo: [
                  {
                    thumburl: "https://upload.wikimedia.org/cape-town.jpg",
                    descriptionurl: "https://commons.wikimedia.org/wiki/File:Cape_Town_Table_Mountain.jpg",
                    extmetadata: {
                      LicenseShortName: { value: "CC BY 4.0" },
                      ImageDescription: { value: "Table Mountain in Cape Town" }
                    }
                  }
                ]
              }
            }
          }
        })
      )
    );

    const asset = await openRouteMediaProvider.getMedia(capeTown!);

    expect(asset).toMatchObject({
      provider: "wikimedia-commons",
      title: "Cape Town Table Mountain.jpg"
    });
  });

  it("revalidates cached media and falls back when the cached asset is unrelated", async () => {
    const intent = interpretTripIntent({
      prompt: "Find a 12 day hiking route from Singapore with one stop.",
      origin: "Singapore",
      tripLengthDays: 12,
      maxStops: 1,
      wishTags: ["hiking"],
      budgetMode: "balanced"
    });
    const route = createTripGeneration(intent).routes[0];
    expect(route).toBeDefined();

    const validAsset = {
      provider: "wikimedia-commons" as const,
      imageUrl: "https://upload.wikimedia.org/chiang-mai.jpg",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Chiang_Mai.jpg",
      title: "Chiang Mai mountain temple.jpg",
      creator: "Route Photographer",
      licenseLabel: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      attributionText: "Chiang Mai mountain temple — Route Photographer / CC BY 4.0 / Wikimedia Commons",
      fetchedAt: new Date().toISOString()
    };
    const provider = {
      id: "wikimedia-commons" as const,
      getMedia: vi.fn().mockResolvedValue(validAsset)
    };
    const cache = {
      get: vi.fn().mockResolvedValue({
        ...validAsset,
        title: "Report upon the Colorado River.pdf",
        attributionText: "Report upon the Colorado River.pdf — Public domain / Wikimedia Commons"
      }),
      set: vi.fn().mockResolvedValue(undefined)
    };

    const [enrichedRoute] = await enrichRoutesWithMedia([route!], provider, cache);

    expect(provider.getMedia).toHaveBeenCalled();
    expect(enrichedRoute.stops.find((stop) => stop.kind === "destination")?.media).toMatchObject({
      title: "Chiang Mai mountain temple.jpg"
    });
    expect(cache.set).toHaveBeenCalled();
  });

  it("falls back to local Wild Route artwork when providers fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockJsonResponse({}, false)));

    const asset = await openRouteMediaProvider.getMedia(destination);

    expect(asset).toMatchObject({
      provider: "local-fallback",
      imageUrl: "/editorial/route-ribbon-hero.png"
    });
    expect(asset.attributionText).toContain("Wild Route local artwork");
  });
});
