import { afterEach, describe, expect, it, vi } from "vitest";

function mockWebhookEnvironment({
  stripeClient,
  adminClient,
  webhookSecret = "whsec_test_secret"
}: {
  stripeClient: unknown;
  adminClient?: unknown;
  webhookSecret?: string | undefined;
}) {
  vi.resetModules();
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
}

describe("Stripe webhook API", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/env");
    vi.doUnmock("@/lib/billing/stripe");
    vi.doUnmock("@/lib/supabase/admin");
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
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { app_user_id: "user_123" },
          customer: "cus_123",
          customer_details: { email: "traveler@example.com" }
        }
      }
    }));
    mockWebhookEnvironment({
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
});
