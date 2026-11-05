import { afterEach, describe, expect, it, vi } from "vitest";
import { searchSkyscanner } from "./skyscanner";

const legs = [
  { origin: "SIN", destination: "DAD", date: "2099-03-01" },
  { origin: "DAD", destination: "SIN", date: "2099-03-08" }
];
const option = {
  price: { amount: "123450", unit: "PRICE_UNIT_MILLI" },
  transferType: "TRANSFER_TYPE_SELF_TRANSFER",
  items: [
    { agentId: "a", deepLink: "https://agw.skyscnr.com/one" },
    { agentId: "b", deepLink: "https://agw.skyscnr.com/two" }
  ]
};

afterEach(() => { vi.unstubAllGlobals(); });

describe("Skyscanner live flight search", () => {
  it("searches the complete dated itinerary and retains every booking link", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ status: "RESULT_STATUS_INCOMPLETE", sessionToken: "opaque+/token" }))
      .mockResolvedValueOnce(Response.json({ status: "RESULT_STATUS_COMPLETE", content: { results: {
        itineraries: { first: { pricingOptions: [option] } }, agents: { a: { name: "Airline A" }, b: { name: "Airline B" } }
      } } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await searchSkyscanner(legs, "private-key");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.query.queryLegs).toHaveLength(2);
    expect(body.query.queryLegs[1].date).toEqual({ year: 2099, month: 3, day: 8 });
    expect(fetchMock.mock.calls[1][0]).toContain("opaque%2B%2Ftoken");
    expect(result.status).toBe("complete");
    expect(result.offers).toEqual([{ amount: 123.45, currency: "USD", transferType: "self_transfer", links: [
      { agent: "Airline A", url: "https://agw.skyscnr.com/one" },
      { agent: "Airline B", url: "https://agw.skyscnr.com/two" }
    ] }]);
    expect(JSON.stringify(result)).not.toContain("private-key");
  });

  it("does not return a multi-ticket price if a required link is unsafe", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: "RESULT_STATUS_COMPLETE", content: { results: {
      itineraries: { one: { pricingOptions: [{ ...option, items: [option.items[0], { agentId: "b", deepLink: "https://evil.example/" }] }] } }
    } } })));
    expect((await searchSkyscanner(legs, "key")).offers).toEqual([]);
  });

  it("labels incomplete results as partial and fails closed for provider errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: "RESULT_STATUS_INCOMPLETE" })));
    expect(await searchSkyscanner(legs, "key")).toMatchObject({ status: "partial", offers: [] });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: "RESULT_STATUS_FAILED" })));
    await expect(searchSkyscanner(legs, "key")).rejects.toThrow("Flight provider unavailable");
  });
});
