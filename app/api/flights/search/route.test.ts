// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "@/lib/auth";
import { searchSkyscanner } from "@/lib/flights/skyscanner";
import { resetRateLimitsForTests } from "@/lib/security/rate-limit";
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/flights/skyscanner", () => ({ searchSkyscanner: vi.fn() }));
const valid = { legs: [{ origin: "SIN", destination: "DAD", date: "2099-03-01" }, { origin: "DAD", destination: "SIN", date: "2099-03-08" }] };
function request(body: unknown) { return new Request("http://localhost/api/flights/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
beforeEach(() => { vi.clearAllMocks(); resetRateLimitsForTests(); vi.stubEnv("SKYSCANNER_ENABLED", "true"); vi.stubEnv("SKYSCANNER_API_KEY", "secret"); });
afterEach(() => vi.unstubAllEnvs());
describe("flight search endpoint", () => {
  it("stays disabled without explicit configuration", async () => { vi.stubEnv("SKYSCANNER_ENABLED", "false"); const { POST } = await import("./route"); expect((await POST(request(valid))).status).toBe(503); expect(searchSkyscanner).not.toHaveBeenCalled(); });
  it("rejects demo and anonymous sessions", async () => { vi.mocked(getCurrentUser).mockResolvedValue(null); const { POST } = await import("./route"); expect((await POST(request(valid))).status).toBe(401); expect(searchSkyscanner).not.toHaveBeenCalled(); });
  it("rejects invalid or disconnected legs before calling the provider", async () => { vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1", authMode: "supabase" } as Awaited<ReturnType<typeof getCurrentUser>>); const { POST } = await import("./route"); expect((await POST(request({ legs: [valid.legs[0], { ...valid.legs[1], origin: "BKK" }] }))).status).toBe(400); expect(searchSkyscanner).not.toHaveBeenCalled(); });
  it("returns normalized results without exposing provider credentials", async () => { vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1", authMode: "supabase" } as Awaited<ReturnType<typeof getCurrentUser>>); vi.mocked(searchSkyscanner).mockResolvedValue({ status: "complete", observedAt: "2099-01-01T00:00:00.000Z", offers: [] }); const { POST } = await import("./route"); const response = await POST(request(valid)); expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store"); expect(JSON.stringify(await response.json())).not.toContain("secret"); expect(searchSkyscanner).toHaveBeenCalledWith(valid.legs, "secret"); });
});
