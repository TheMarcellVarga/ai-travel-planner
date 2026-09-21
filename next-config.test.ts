import { describe, expect, it } from "vitest";

import nextConfig from "./next.config.mjs";

describe("Next image configuration", () => {
  it("allows every Wikimedia host returned by the media provider", () => {
    const configuredHosts = nextConfig.images?.remotePatterns?.map(
      (pattern) => pattern.hostname
    );

    expect(configuredHosts).toEqual(
      expect.arrayContaining([
        "commons.wikimedia.org",
        "thumb.wikimedia.org",
        "upload.wikimedia.org"
      ])
    );
  });
});
