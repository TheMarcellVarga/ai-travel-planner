import { afterEach, describe, expect, it, vi } from "vitest";

import { destinations } from "@/lib/data/destinations";
import { openRouteMediaProvider } from "@/lib/planner/providers/media-provider";

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
                title: "File:Route stop.jpg",
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
      title: "Route stop.jpg",
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
                title: "File:Restricted.jpg",
                imageinfo: [
                  {
                    thumburl: "https://upload.wikimedia.org/restricted.jpg",
                    descriptionurl: "https://commons.wikimedia.org/wiki/File:Restricted.jpg",
                    extmetadata: { LicenseShortName: { value: "CC BY-NC-ND 4.0" } }
                  }
                ]
              },
              "2": {
                title: "File:Allowed.jpg",
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
    expect(asset.title).toBe("Allowed.jpg");
    expect(asset.licenseLabel).toBe("Public domain");
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
