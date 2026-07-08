import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ensureEntitlementForUser,
  FREE_ENTITLEMENT
} from "@/lib/account/entitlements";
import { getCurrentUser } from "@/lib/auth";
import { getStripe } from "@/lib/billing/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn()
}));

vi.mock("@/lib/billing/stripe", () => ({
  getStripe: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/account/entitlements", async () => {
  const actual = await vi.importActual<typeof import("@/lib/account/entitlements")>(
    "@/lib/account/entitlements"
  );

  return {
    ...actual,
    ensureEntitlementForUser: vi.fn()
  };
});

vi.mock("@/lib/env", () => ({
  env: {
    appUrl: "https://wildroute.test",
    stripeProPriceId: "price_pro_server_owned"
  }
}));

const supabaseUser = {
  id: "user_123",
  email: "traveler@example.com",
  name: "Traveler",
  authMode: "supabase" as const,
  entitlement: FREE_ENTITLEMENT,
  profile: null
};

function createSupabaseMock() {
  const upsert = vi.fn(async () => ({ data: null, error: null }));
  const from = vi.fn(() => ({ upsert }));

  return {
    client: { from },
    from,
    upsert
  };
}

describe("billing API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    vi.mocked(getStripe).mockReturnValue(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);
    vi.mocked(ensureEntitlementForUser).mockResolvedValue(FREE_ENTITLEMENT);
  });

  describe("checkout", () => {
    it("requires a Supabase-authenticated user", async () => {
      const { POST } = await import("@/app/api/billing/checkout/route");
      const response = await POST();

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: "Sign in with a real account before starting checkout."
      });
      expect(getStripe).not.toHaveBeenCalled();
    });

    it("fails safely when Stripe or Supabase is unavailable", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(supabaseUser);

      const { POST } = await import("@/app/api/billing/checkout/route");
      const response = await POST();

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: "Stripe is not configured yet." });
      expect(ensureEntitlementForUser).not.toHaveBeenCalled();
    });

    it("uses the server-owned price and reuses an existing Stripe customer", async () => {
      const sessionsCreate = vi.fn(async () => ({
        url: "https://checkout.stripe.test/session"
      }));
      const customersCreate = vi.fn();
      const stripe = {
        customers: { create: customersCreate },
        checkout: { sessions: { create: sessionsCreate } }
      };
      const supabase = createSupabaseMock();

      vi.mocked(getCurrentUser).mockResolvedValue(supabaseUser);
      vi.mocked(getStripe).mockReturnValue(stripe as never);
      vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase.client as never);
      vi.mocked(ensureEntitlementForUser).mockResolvedValue({
        ...FREE_ENTITLEMENT,
        stripeCustomerId: "cus_existing"
      });

      const { POST } = await import("@/app/api/billing/checkout/route");
      const response = await POST();

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        url: "https://checkout.stripe.test/session"
      });
      expect(customersCreate).not.toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
      expect(sessionsCreate).toHaveBeenCalledWith({
        mode: "subscription",
        customer: "cus_existing",
        line_items: [
          {
            price: "price_pro_server_owned",
            quantity: 1
          }
        ],
        success_url: "https://wildroute.test/account?billing=success",
        cancel_url: "https://wildroute.test/account?billing=cancelled",
        metadata: {
          app_user_id: "user_123"
        },
        subscription_data: {
          metadata: {
            app_user_id: "user_123"
          }
        }
      });
    });

    it("creates and persists a Stripe customer before checkout when needed", async () => {
      const customersCreate = vi.fn(async () => ({ id: "cus_new" }));
      const sessionsCreate = vi.fn(async () => ({
        url: "https://checkout.stripe.test/new-session"
      }));
      const stripe = {
        customers: { create: customersCreate },
        checkout: { sessions: { create: sessionsCreate } }
      };
      const supabase = createSupabaseMock();

      vi.mocked(getCurrentUser).mockResolvedValue(supabaseUser);
      vi.mocked(getStripe).mockReturnValue(stripe as never);
      vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase.client as never);
      vi.mocked(ensureEntitlementForUser).mockResolvedValue(FREE_ENTITLEMENT);

      const { POST } = await import("@/app/api/billing/checkout/route");
      const response = await POST();

      expect(response.status).toBe(200);
      expect(customersCreate).toHaveBeenCalledWith({
        email: "traveler@example.com",
        metadata: { app_user_id: "user_123" }
      });
      expect(supabase.from).toHaveBeenCalledWith("entitlements");
      expect(supabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user_123",
          plan: "free",
          billing_email: "traveler@example.com",
          stripe_customer_id: "cus_new"
        }),
        { onConflict: "user_id" }
      );
      expect(sessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ customer: "cus_new" })
      );
    });
  });

  describe("portal", () => {
    it("requires a Supabase-authenticated user", async () => {
      const { POST } = await import("@/app/api/billing/portal/route");
      const response = await POST();

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: "Sign in with a real account before opening billing."
      });
    });

    it("rejects portal creation when no Stripe customer exists", async () => {
      const portalCreate = vi.fn();
      const stripe = {
        billingPortal: { sessions: { create: portalCreate } }
      };
      const supabase = createSupabaseMock();

      vi.mocked(getCurrentUser).mockResolvedValue(supabaseUser);
      vi.mocked(getStripe).mockReturnValue(stripe as never);
      vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase.client as never);
      vi.mocked(ensureEntitlementForUser).mockResolvedValue(FREE_ENTITLEMENT);

      const { POST } = await import("@/app/api/billing/portal/route");
      const response = await POST();

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "No Stripe customer exists yet. Start checkout first."
      });
      expect(portalCreate).not.toHaveBeenCalled();
    });

    it("creates a portal session for the entitlement customer", async () => {
      const portalCreate = vi.fn(async () => ({
        url: "https://billing.stripe.test/session"
      }));
      const stripe = {
        billingPortal: { sessions: { create: portalCreate } }
      };
      const supabase = createSupabaseMock();

      vi.mocked(getCurrentUser).mockResolvedValue(supabaseUser);
      vi.mocked(getStripe).mockReturnValue(stripe as never);
      vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase.client as never);
      vi.mocked(ensureEntitlementForUser).mockResolvedValue({
        ...FREE_ENTITLEMENT,
        stripeCustomerId: "cus_existing"
      });

      const { POST } = await import("@/app/api/billing/portal/route");
      const response = await POST();

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        url: "https://billing.stripe.test/session"
      });
      expect(portalCreate).toHaveBeenCalledWith({
        customer: "cus_existing",
        return_url: "https://wildroute.test/account"
      });
    });
  });
});
