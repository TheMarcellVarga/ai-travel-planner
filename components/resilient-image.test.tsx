import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { ResilientImage } from "@/components/resilient-image";

describe("ResilientImage", () => {
  it("switches failed remote media to local branded artwork", () => {
    render(
      <ResilientImage
        alt="Layered green rice terraces"
        height={200}
        src="https://images.example.test/terraces.jpg"
        width={300}
      />
    );

    const image = screen.getByRole("img", {
      name: "Layered green rice terraces"
    });
    expect(image).toHaveAttribute("data-media-state", "primary");

    fireEvent.error(image);

    const fallback = screen.getByRole("img", {
      name: /Local Wild Route artwork is shown/
    });
    expect(fallback).toHaveAttribute("data-media-state", "degraded");
    expect(fallback.getAttribute("src")).toContain("route-ribbon-hero.png");
  });

  it("keeps decorative fallback media out of the accessibility tree", () => {
    const { container } = render(
      <ResilientImage
        alt=""
        height={200}
        src="https://images.example.test/decorative.jpg"
        width={300}
      />
    );
    const image = container.querySelector("img");

    expect(image).not.toBeNull();
    fireEvent.error(image!);
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("data-media-state", "degraded");
  });
});
