import { afterEach, describe, expect, it, vi } from "vitest";

import {
  emitOperationalEvent,
  getSafeErrorKind,
  hashOperationalIdentifier
} from "@/lib/observability/operational-events";

describe("operational events", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits only allowlisted structured fields", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    emitOperationalEvent("info", "request.rate_limited", {
      route: "/api/trips/plan",
      status: 429,
      code: "RATE_LIMITED",
      durationMs: 12
    });

    const record = JSON.parse(String(info.mock.calls[0]?.[0]));
    expect(record).toMatchObject({
      level: "info",
      name: "request.rate_limited",
      route: "/api/trips/plan",
      status: 429,
      code: "RATE_LIMITED",
      durationMs: 12
    });
    expect(record.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("drops unsafe dynamic tokens instead of logging their content", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    emitOperationalEvent("warn", "stripe.webhook.failed", {
      route: "/api/stripe/webhook",
      code: "traveler@example.com secret prompt",
      eventType: "customer.subscription.updated\nraw payload"
    });

    const serializedRecord = String(warn.mock.calls[0]?.[0]);
    const record = JSON.parse(serializedRecord);
    expect(record.code).toBeUndefined();
    expect(record.eventType).toBeUndefined();
    expect(serializedRecord).not.toContain("traveler@example.com");
    expect(serializedRecord).not.toContain("raw payload");
  });

  it("pseudonymizes identifiers with a stable bounded digest", () => {
    const first = hashOperationalIdentifier("evt_sensitive_123");
    const second = hashOperationalIdentifier("evt_sensitive_123");

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{24}$/);
    expect(first).not.toContain("evt_sensitive_123");
  });

  it("classifies errors without exposing messages or stacks", () => {
    const error = new TypeError("traveler@example.com and a private prompt");

    expect(getSafeErrorKind(error)).toBe("typeerror");
    expect(getSafeErrorKind("raw provider failure")).toBe("unknown_error");
  });
});
