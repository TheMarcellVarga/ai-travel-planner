// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimitsForTests } from "@/lib/security/rate-limit";

const signInWithOtp = vi.fn();
vi.mock("@/lib/env", () => ({ hasSupabaseEnv: true, env: { appUrl: "http://localhost:3000" } }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { signInWithOtp } })
}));

describe("email sign-in", () => {
  beforeEach(() => { resetRateLimitsForTests(); vi.clearAllMocks(); });

  it("redirects a successful form submission with GET", async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost:3000/api/auth/signin", {
      method: "POST", body: new URLSearchParams({ email: "traveler@example.com", next: "/saved" })
    }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/auth?sent=1");
    expect(signInWithOtp).toHaveBeenCalledWith(expect.objectContaining({
      options: { emailRedirectTo: "http://localhost:3000/auth/callback?next=%2Fsaved" }
    }));
  });
});
