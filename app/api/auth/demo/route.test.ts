// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { resetRateLimitsForTests } from "@/lib/security/rate-limit";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/auth", () => ({ DEMO_USER_COOKIE: "wild_route_demo_user" }));

const setCookie = vi.fn();
function request(email = "demo@wildroute.local", next = "/saved") {
  return new Request("http://localhost:3000/api/auth/demo", {
    method: "POST",
    body: new URLSearchParams({ email, next })
  });
}

describe("demo session isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitsForTests();
    vi.mocked(cookies).mockResolvedValue({ set: setCookie } as unknown as Awaited<ReturnType<typeof cookies>>);
  });

  it("assigns distinct server-generated identities even with the same submitted email", async () => {
    const { POST } = await import("./route");
    await POST(request());
    await POST(request());
    const first = setCookie.mock.calls[0][1];
    const second = setCookie.mock.calls[1][1];
    expect(first).not.toBe(second);
    expect(first).toMatch(/^demo@[a-f0-9-]+\.wildroute\.local$/);
    expect(setCookie.mock.calls[0][2]).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("cannot select another demo identity or redirect to an external site", async () => {
    const { POST } = await import("./route");
    const response = await POST(request("someone-else@example.com", "https://example.com"));
    expect(setCookie.mock.calls[0][1]).not.toBe("someone-else@example.com");
    expect(response.headers.get("location")).toBe("http://localhost:3000/planner");
  });
});
