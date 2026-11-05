import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteGlobe } from "./route-globe";

vi.mock("next/dynamic", () => ({ default: () => () => null }));

describe("route globe fallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("React", React);
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("keeps the journey visible when WebGL is unavailable", () => {
    render(<RouteGlobe routes={[]} activeRouteId={null} onSelectRoute={() => {}} fallback={<p>Journey fallback</p>} />);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText("Journey fallback")).toBeInTheDocument();
  });
});
