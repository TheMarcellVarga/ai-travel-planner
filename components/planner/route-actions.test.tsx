import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteActions } from "./route-actions";

describe("route action response failures", () => {
  beforeEach(() => { vi.stubGlobal("React", React); });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("does not claim a flight search is ready when no provider link is returned", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ links: [] })));
    render(<RouteActions routeId="route-test" publicView />);
    fireEvent.click(screen.getByText("Open booking handoff"));
    expect(await screen.findByText("Flight search is unavailable for this route. Try again later.")).toBeInTheDocument();
    expect(screen.queryByText("Continue to flight search")).not.toBeInTheDocument();
  });

  it("does not claim publication succeeded when no share link is returned", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({})));
    render(<RouteActions routeId="route-test" />);
    fireEvent.click(screen.getByText("Publish"));
    expect(await screen.findByText("A share link could not be created. Try again.")).toBeInTheDocument();
    expect(screen.queryByText("Your route preview is ready.")).not.toBeInTheDocument();
  });
});
