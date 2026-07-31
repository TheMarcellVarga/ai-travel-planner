import { afterEach, describe, expect, it, vi } from "vitest";

function mockWebhookEnvironment({
  stripeClient,
  adminClient,
  webhookSecret = "whsec_test_secret",
  claimStatus = "claimed"
}: {
  stripeClient: unknown;
  adminClient?: unknown;
  webhookSecret?: string | undefined;
  claimStatus?: "claimed" | "duplicate" | "unavailable";
}) {
  vi.resetModules();
  const claimWebhookEvent = vi.fn(async () => ({ status: claimStatus }));
  const completeWebhookEvent = vi.fn(async () => true);
  const failWebhookEvent = vi.fn(async () => true);
  const emitOperationalEvent = vi.fn();
  vi.doMock("@/lib/env", () => ({
    env: {
      stripeWebhookSecret: webhookSecret,
      stripeProPriceId: "price_pro"
    }
  }));
  vi.doMock("@/lib/billing/stripe", () => ({
    getStripe: vi.fn(() => stripeClient),
    isActiveSubscription: (status: string | null | undefined) =>
      status === "active" || status === "trialing"
  }));
  vi.doMock("@/lib/supabase/admin", () => ({
    createSupabaseAdminClient: vi.fn(() => adminClient ?? null)
  }));
  vi.doMock("@/lib/billing/webhook-events", () => ({
    claimWebhookEvent,
    completeWebhookEvent,
    failWebhookEvent
  }));
  vi.doMock("@/lib/observability/operational-events", () => ({
    emitOperationalEvent,
    getSafeErrorKind: () => "unknown_error",
    hashOperationalIdentifier: () => "subject_hash"
  }));

  return {
    claimWebhookEvent,
    completeWebhookEvent,
    failWebhookEvent,
    emitOperationalEvent
  };
}

describe("Stripe webhook API", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/env");
    vi.doUnmock("@/lib/billing/stripe");
    vi.doUnmock("@/lib/supabase/admin");
    vi.doUnmock("@/lib/billing/webhook-events");
    vi.doUnmock("@/lib/observability/operational-events");
    vi.resetModules();
  });

  it("fails closed when Stripe webhook configuration is missing", async () => {
    mockWebhookEnvironment({
      stripeClient: null,
      webhookSecret: "whsec_test_secret"
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "sig_test" }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({ error: "Stripe webhook is not configured." });
  });

  it("rejects invalid signatures without echoing provider error details", async () => {
    const constructEvent = vi.fn(() => {
      throw new Error("provider details with whsec_test_secret should stay private");
    });
    mockWebhookEnvironment({
      stripeClient: {
        webhooks: { constructEvent }
      }
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{\"id\":\"evt_bad\"}",
        headers: { "stripe-signature": "sig_bad" }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Invalid Stripe webhook signature." });
    expect(JSON.stringify(payload)).not.toContain("whsec_test_secret");
    expect(constructEvent).toHaveBeenCalledWith(
      "{\"id\":\"evt_bad\"}",
      "sig_bad",
      "whsec_test_secret"
    );
  });

  it("syncs free entitlement metadata for completed checkout sessions", async () => {
    const upsert = vi.fn(async () => ({ data: null, error: null }));
    const from = vi.fn(() => ({ upsert }));
    const constructEvent = vi.fn(() => ({
      id: "evt_checkout",
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { app_user_id: "user_123" },
          customer: "cus_123",
          customer_details: { email: "traveler@example.com" }
        }
      }
    }));
    const ledger = mockWebhookEnvironment({
      stripeClient: {
        webhooks: { constructEvent }
      },
      adminClient: { from }
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{\"id\":\"evt_checkout\"}",
        headers: { "stripe-signature": "sig_valid" }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ received: true });
    expect(ledger.claimWebhookEvent).toHaveBeenCalledWith({
      eventId: "evt_checkout",
      eventType: "checkout.session.completed"
    });
    expect(ledger.completeWebhookEvent).toHaveBeenCalledWith("evt_checkout");
    expect(from).toHaveBeenCalledWith("entitlements");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user_123",
        plan: "free",
        billing_email: "traveler@example.com",
        stripe_customer_id: "cus_123"
      }),
      { onConflict: "user_id" }
    );
  });

  it("acknowledges duplicate events without repeating entitlement writes", async () => {
    const upsert = vi.fn(async () => ({ data: null, error: null }));
    const from = vi.fn(() => ({ upsert }));
    const constructEvent = vi.fn(() => ({
      id: "evt_duplicate",
      type: "checkout.session.completed",
      data: { object: {} }
    }));
    const ledger = mockWebhookEnvironment({
      stripeClient: { webhooks: { constructEvent } },
      adminClient: { from },
      claimStatus: "duplicate"
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{\"id\":\"evt_duplicate\"}",
        headers: { "stripe-signature": "sig_valid" }
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, duplicate: true });
    expect(from).not.toHaveBeenCalled();
    expect(ledger.completeWebhookEvent).not.toHaveBeenCalled();
    expect(ledger.emitOperationalEvent).toHaveBeenCalledWith(
      "info",
      "stripe.webhook.duplicate",
      expect.objectContaining({ subjectHash: "subject_hash" })
    );
  });

  it("fails closed when the durable event ledger is unavailable", async () => {
    const constructEvent = vi.fn(() => ({
      id: "evt_unavailable",
      type: "customer.subscription.updated",
      data: { object: {} }
    }));
    const ledger = mockWebhookEnvironment({
      stripeClient: { webhooks: { constructEvent } },
      claimStatus: "unavailable"
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{\"id\":\"evt_unavailable\"}",
        headers: { "stripe-signature": "sig_valid" }
      })
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Stripe webhook processing is temporarily unavailable."
    });
    expect(ledger.completeWebhookEvent).not.toHaveBeenCalled();
  });

  it("marks failed entitlement writes for safe retry", async () => {
    const upsert = vi.fn(async () => ({
      data: null,
      error: { code: "DATABASE_WRITE_FAILED", message: "private billing details" }
    }));
    const from = vi.fn(() => ({ upsert }));
    const constructEvent = vi.fn(() => ({
      id: "evt_failed",
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { app_user_id: "user_123" },
          customer: "cus_private"
        }
      }
    }));
    const ledger = mockWebhookEnvironment({
      stripeClient: { webhooks: { constructEvent } },
      adminClient: { from }
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{\"id\":\"evt_failed\"}",
        headers: { "stripe-signature": "sig_valid" }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Stripe webhook processing failed." });
    expect(JSON.stringify(payload)).not.toContain("private billing details");
    expect(ledger.failWebhookEvent).toHaveBeenCalledWith(
      "evt_failed",
      "unknown_error"
    );
    expect(ledger.completeWebhookEvent).not.toHaveBeenCalled();
  });
});
