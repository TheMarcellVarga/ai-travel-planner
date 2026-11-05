import React from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { FREE_ENTITLEMENT } from "@/lib/account/entitlements";
import { getCurrentUser } from "@/lib/auth";
import { createTripGeneration } from "@/lib/planner/generate-routes";
import { interpretTripIntent } from "@/lib/planner/intent";
import {
  getLatestGenerationForUser
} from "@/lib/store/demo-store";
import {
  getLatestGenerationForUserFromDatabase
} from "@/lib/store/persistent-store";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn()
}));

vi.mock("@/lib/store/demo-store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/store/demo-store")>(
    "@/lib/store/demo-store"
  );

  return {
    ...actual,
    getLatestGenerationForUser: vi.fn()
  };
});

vi.mock("@/lib/store/persistent-store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/store/persistent-store")>(
    "@/lib/store/persistent-store"
  );

  return {
    ...actual,
    getLatestGenerationForUserFromDatabase: vi.fn()
  };
});

const demoUser = {
  id: "demo:demo@wildroute.local",
  email: "demo@wildroute.local",
  name: "Demo",
  authMode: "demo" as const,
  entitlement: FREE_ENTITLEMENT,
  profile: null
};

describe("planner page", () => {
  beforeAll(() => {
    vi.stubGlobal("React", React);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(demoUser);
    vi.mocked(getLatestGenerationForUser).mockReturnValue(null);
    vi.mocked(getLatestGenerationForUserFromDatabase).mockResolvedValue(null);
  });

  it("reuses the latest demo generation", async () => {
    const existingGeneration = createTripGeneration(
      interpretTripIntent({ prompt: "Existing route from Budapest." })
    );
    vi.mocked(getLatestGenerationForUser).mockReturnValue(existingGeneration);

    const { default: PlannerPage } = await import("@/app/planner/page");
    const page = await PlannerPage();

    expect(page.props.initialGeneration).toBe(existingGeneration);
    expect(getLatestGenerationForUser).toHaveBeenCalledWith(demoUser.id);
  });

  it("starts without manufacturing a demo generation", async () => {
    const { default: PlannerPage } = await import("@/app/planner/page");
    const page = await PlannerPage();

    expect(page.props.initialGeneration).toBeNull();
    expect(getLatestGenerationForUser).toHaveBeenCalledWith(demoUser.id);
  });

  it("does not expose a previous visitor's anonymous generation", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    vi.mocked(getLatestGenerationForUser).mockReturnValue(
      createTripGeneration(interpretTripIntent({ prompt: "A private previous visitor brief" }))
    );
    const { default: PlannerPage } = await import("@/app/planner/page");
    const page = await PlannerPage();
    expect(page.props.initialGeneration).toBeNull();
    expect(getLatestGenerationForUser).not.toHaveBeenCalled();
    expect(getLatestGenerationForUserFromDatabase).not.toHaveBeenCalled();
  });

  it("prefers the latest database generation for Supabase users", async () => {
    const persistedGeneration = createTripGeneration(
      interpretTripIntent({ prompt: "Persisted route from Budapest." })
    );
    vi.mocked(getCurrentUser).mockResolvedValue({
      ...demoUser,
      id: "user_123",
      authMode: "supabase"
    });
    vi.mocked(getLatestGenerationForUserFromDatabase).mockResolvedValue(
      persistedGeneration
    );

    const { default: PlannerPage } = await import("@/app/planner/page");
    const page = await PlannerPage();

    expect(page.props.initialGeneration).toBe(persistedGeneration);
    expect(getLatestGenerationForUser).not.toHaveBeenCalled();
  });
});
