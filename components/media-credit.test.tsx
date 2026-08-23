import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { MediaCredit } from "@/components/media-credit";
import type { MediaAsset } from "@/lib/media";

const asset: MediaAsset = {
  kind: "image",
  src: "/route.jpg",
  alt: "A route study",
  title: "A long Commons title that should remain available on focus",
  author: "Wild Route Photographer",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Route.jpg",
  licenseLabel: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
};

describe("MediaCredit", () => {
  it("keeps the visible credit compact while preserving the full attribution", () => {
    render(<MediaCredit asset={asset} compact />);

    const source = screen.getByRole("link", { name: /^Source\./ });
    expect(source).toHaveTextContent("Source");
    expect(source).toHaveAttribute("href", asset.sourceUrl);
    expect(source).toHaveAttribute("aria-label", expect.stringContaining(asset.title));
    expect(screen.getByRole("tooltip")).toHaveTextContent(asset.author);
    expect(screen.getByRole("tooltip")).toHaveTextContent(asset.licenseLabel);
    expect(screen.getByRole("tooltip").querySelector("a")).toHaveAttribute(
      "href",
      asset.licenseUrl
    );
  });
});
