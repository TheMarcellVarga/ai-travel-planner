import { afterEach, describe, expect, it, vi } from "vitest";

async function importHealthRoute({
  supabase,
  admin,
  stripe,
  email
}: {
  supabase: boolean;
  admin: boolean;
  stripe: boolean;
  email: boolean;
}) {
  vi.resetModules();
  vi.doMock("@/lib/env", () => ({
    env: {
      supabaseUrl: "https://example.supabase.co",
      supabasePublishableKey: "anon_visible_but_not_reported",
      supabaseServiceRoleKey: "service_role_secret",
      stripeSecretKey: "sk_test_secret",
      stripeWebhookSecret: "whsec_secret",
      stripeProPriceId: "price_pro"
    },
    hasSupabaseEnv: supabase,
    hasSupabaseAdminEnv: admin,
    hasStripeEnv: stripe
  }));
  vi.doMock("@/lib/email", () => ({
    hasEmailEnv: vi.fn(() => email)
  }));

  return import("@/app/api/health/route");
}

describe("health API", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/env");
    vi.doUnmock("@/lib/email");
    vi.resetModules();
  });

  it("reports degraded status when core Supabase config is missing", async () => {
    const { GET } = await importHealthRoute({
      supabase: false,
      admin: false,
      stripe: false,
      email: false
    });

    const response = GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(payload).toMatchObject({
      status: "degraded",
      services: {
        auth: false,
        database: false,
        adminApi: false,
        billing: false,
        email: false
      }
    });
    expect(JSON.stringify(payload)).not.toContain("secret");
    expect(JSON.stringify(payload)).not.toContain("sk_test");
    expect(JSON.stringify(payload)).not.toContain("whsec");
  });

  it("reports only boolean service status when integrations are configured", async () => {
    const { GET } = await importHealthRoute({
      supabase: true,
      admin: true,
      stripe: true,
      email: true
    });

    const response = GET();
    const payload = await response.json();

    expect(payload).toMatchObject({
      status: "ok",
      services: {
        auth: true,
        database: true,
        adminApi: true,
        billing: true,
        email: true
      }
    });
    expect(payload.timestamp).toEqual(expect.any(String));
    expect(Object.values(payload.services)).toEqual([true, true, true, true, true]);
    expect(JSON.stringify(payload)).not.toContain("service_role_secret");
    expect(JSON.stringify(payload)).not.toContain("price_pro");
  });
});
