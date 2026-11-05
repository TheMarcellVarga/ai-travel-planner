import { z } from "zod";

export type FlightLeg = { origin: string; destination: string; date: string };
export type FlightOffer = {
  amount: number;
  currency: "USD";
  transferType: "managed" | "self_transfer" | "protected_self_transfer" | "unknown";
  links: { agent: string; url: string }[];
};
export type FlightSearchResult = {
  status: "complete" | "partial";
  observedAt: string;
  offers: FlightOffer[];
};

const priceSchema = z.object({
  amount: z.string().regex(/^\d{1,15}(?:\.\d{1,6})?$/),
  unit: z.enum(["PRICE_UNIT_WHOLE", "PRICE_UNIT_CENTI", "PRICE_UNIT_MILLI", "PRICE_UNIT_MICRO"])
});
const resultSchema = z.object({
  sessionToken: z.string().min(1).max(2048).optional(),
  status: z.enum(["RESULT_STATUS_COMPLETE", "RESULT_STATUS_INCOMPLETE", "RESULT_STATUS_FAILED"]),
  action: z.string().optional(),
  content: z.object({ results: z.object({
    itineraries: z.record(z.object({ pricingOptions: z.array(z.object({
      price: priceSchema,
      transferType: z.string().optional(),
      items: z.array(z.object({ agentId: z.string().optional(), deepLink: z.string().url() })).min(1).max(6)
    })).max(100) })).optional(),
    agents: z.record(z.object({ name: z.string().max(150) })).optional()
  }).optional() }).optional()
});

const units = { PRICE_UNIT_WHOLE: 1, PRICE_UNIT_CENTI: 100, PRICE_UNIT_MILLI: 1000, PRICE_UNIT_MICRO: 1000000 } as const;
const transferTypes: Record<string, FlightOffer["transferType"]> = {
  TRANSFER_TYPE_MANAGED: "managed",
  TRANSFER_TYPE_SELF_TRANSFER: "self_transfer",
  TRANSFER_TYPE_PROTECTED_SELF_TRANSFER: "protected_self_transfer"
};

function safeLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "agw.skyscnr.com" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function normalizeOffers(payload: z.infer<typeof resultSchema>): FlightOffer[] {
  const results = payload.content?.results;
  return Object.values(results?.itineraries ?? {}).flatMap(itinerary => itinerary.pricingOptions.flatMap(option => {
    const links = option.items.map(item => {
      const url = safeLink(item.deepLink);
      return url ? { agent: results?.agents?.[item.agentId ?? ""]?.name ?? "Flight provider", url } : null;
    });
    // Never present a combined offer when even one required booking link is missing.
    if (links.some(link => !link)) return [];
    const amount = Number(option.price.amount) / units[option.price.unit];
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return [];
    return [{ amount, currency: "USD" as const, transferType: transferTypes[option.transferType ?? ""] ?? "unknown", links: links as FlightOffer["links"] }];
  })).sort((a, b) => a.amount - b.amount).slice(0, 5);
}

export async function searchSkyscanner(legs: FlightLeg[], apiKey: string): Promise<FlightSearchResult> {
  const base = "https://partners.api.skyscanner.net/apiservices/v3/flights/live/search";
  async function call(url: string, body?: unknown) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000)
    });
    if (!response.ok) throw new Error("Flight provider unavailable");
    return resultSchema.parse(await response.json());
  }
  let result = await call(`${base}/create`, { query: {
    market: "SG", locale: "en-SG", currency: "USD", adults: 1,
    cabinClass: "CABIN_CLASS_ECONOMY", nearbyAirports: false,
    queryLegs: legs.map(leg => {
      const [year, month, day] = leg.date.split("-").map(Number);
      return { originPlaceId: { iata: leg.origin }, destinationPlaceId: { iata: leg.destination }, date: { year, month, day } };
    })
  } });
  if (result.status === "RESULT_STATUS_FAILED") throw new Error("Flight provider unavailable");
  // Bound polling and retain the previous snapshot if the provider reports no change.
  for (let count = 0; count < 2 && result.status === "RESULT_STATUS_INCOMPLETE" && result.sessionToken; count++) {
    const polled = await call(`${base}/poll/${encodeURIComponent(result.sessionToken)}`);
    if (polled.status === "RESULT_STATUS_FAILED") throw new Error("Flight provider unavailable");
    if (polled.action === "RESULT_ACTION_NOT_MODIFIED") {
      result = { ...result, status: polled.status, sessionToken: polled.sessionToken ?? result.sessionToken };
    } else {
      result = { ...polled, sessionToken: polled.sessionToken ?? result.sessionToken };
    }
  }
  return { status: result.status === "RESULT_STATUS_COMPLETE" ? "complete" : "partial", observedAt: new Date().toISOString(), offers: normalizeOffers(result) };
}
