import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  claimWebhookEvent,
  completeWebhookEvent,
  failWebhookEvent,
  type WebhookEventStore
} from "@/lib/billing/webhook-events";

const now = Date.UTC(2026, 7, 1, 0, 0, 0);

function createStore(
  overrides: Partial<WebhookEventStore> = {}
): WebhookEventStore {
  return {
    insert: vi.fn(async () => "inserted" as const),
    find: vi.fn(async () => null),
    reclaim: vi.fn(async () => false),
    complete: vi.fn(async () => true),
    fail: vi.fn(async () => true),
    ...overrides
  };
}

describe("Stripe webhook event ledger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("claims a newly inserted event with a bounded processing lease", async () => {
    const store = createStore();

    await expect(
      claimWebhookEvent(
        { eventId: "evt_new", eventType: "checkout.session.completed" },
        { now, store }
      )
    ).resolves.toEqual({ status: "claimed" });
    expect(store.insert).toHaveBeenCalledWith({
      eventId: "evt_new",
      eventType: "checkout.session.completed",
      now: new Date(now).toISOString(),
      leaseExpiresAt: new Date(now + 5 * 60_000).toISOString()
    });
  });

  it("suppresses completed events and concurrent active leases", async () => {
    const completedStore = createStore({
      insert: vi.fn(async () => "duplicate" as const),
      find: vi.fn(async () => ({
        status: "completed" as const,
        lease_expires_at: null,
        attempt_count: 1
      }))
    });
    const processingStore = createStore({
      insert: vi.fn(async () => "duplicate" as const),
      find: vi.fn(async () => ({
        status: "processing" as const,
        lease_expires_at: new Date(now + 30_000).toISOString(),
        attempt_count: 1
      }))
    });

    await expect(
      claimWebhookEvent(
        { eventId: "evt_complete", eventType: "customer.subscription.updated" },
        { now, store: completedStore }
      )
    ).resolves.toEqual({ status: "duplicate" });
    await expect(
      claimWebhookEvent(
        { eventId: "evt_processing", eventType: "customer.subscription.updated" },
        { now, store: processingStore }
      )
    ).resolves.toEqual({ status: "duplicate" });
  });

  it("reclaims failed or expired processing attempts atomically", async () => {
    const reclaim = vi.fn(async () => true);
    const store = createStore({
      insert: vi.fn(async () => "duplicate" as const),
      find: vi.fn(async () => ({
        status: "failed" as const,
        lease_expires_at: null,
        attempt_count: 2
      })),
      reclaim
    });

    await expect(
      claimWebhookEvent(
        { eventId: "evt_retry", eventType: "customer.subscription.updated" },
        { now, store }
      )
    ).resolves.toEqual({ status: "claimed" });
    expect(reclaim).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "evt_retry",
        previousStatus: "failed",
        nextAttemptCount: 3
      })
    );
  });

  it("fails closed when ledger persistence is unavailable", async () => {
    const store = createStore({
      insert: vi.fn(async () => "error" as const)
    });

    await expect(
      claimWebhookEvent(
        { eventId: "evt_error", eventType: "checkout.session.completed" },
        { now, store }
      )
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("records completion and privacy-safe failure state", async () => {
    const store = createStore();

    await expect(
      completeWebhookEvent("evt_complete", { now, store })
    ).resolves.toBe(true);
    await expect(
      failWebhookEvent("evt_failed", "typeerror", { now, store })
    ).resolves.toBe(true);
    expect(store.complete).toHaveBeenCalledWith(
      "evt_complete",
      new Date(now).toISOString()
    );
    expect(store.fail).toHaveBeenCalledWith(
      "evt_failed",
      "typeerror",
      new Date(now).toISOString()
    );
  });
});
