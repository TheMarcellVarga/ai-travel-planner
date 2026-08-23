import { defaultOrigin, knownOrigins } from "@/lib/data/destinations";
import type { BudgetMode, OriginProfile, RouteType, TripIntent, WishTag } from "@/lib/types";

type TripIntentInput = {
  prompt: string;
  origin?: string;
  routeType?: RouteType;
  tripLengthDays?: number;
  maxStops?: number;
  departureDate?: string | null;
  wishTags?: string[];
  budgetMode?: BudgetMode;
};

const tagKeywords: Record<WishTag, string[]> = {
  "crypto-friendly": ["crypto", "bitcoin", "web3"],
  "animal-friendly": ["animal", "dogs", "wildlife", "horse", "cat"],
  hiking: ["hiking", "trek", "trail", "mountain"],
  mtb: ["mtb", "mountain bike", "downhill", "bike"],
  surf: ["surf", "waves", "coast", "beach"]
};

const unsupportedSafetyPatterns = [
  {
    pattern: /\b(guarantee|guaranteed|guarantees)\b/i,
    message: "Wild Route cannot guarantee price, availability, safety, or route feasibility."
  },
  {
    pattern: /\b(visa|immigration|passport)\b/i,
    message: "Visa, immigration, and passport requirements must be checked with official sources."
  },
  {
    pattern: /\b(safe|safest|risk-free|no risk)\b/i,
    message: "Route output is not safety, legal, health, weather, or emergency advice."
  },
  {
    pattern: /\b(illegal|smuggl|evade|bypass border|fake documents?)\b/i,
    message: "Wild Route will not help plan illegal or unsafe travel activity."
  },
  {
    pattern: /\b(ignore|override|disregard)\b.{0,48}\b(instructions?|rules?|guardrails?)\b/i,
    message: "Prompt instructions cannot override Wild Route product and safety guardrails."
  },
  {
    pattern: /\b(confirmed availability|provider-confirmed|book directly with wild route)\b/i,
    message: "Availability and booking remain external-provider responsibilities."
  }
];

function inferOrigin(input?: string): OriginProfile {
  if (!input?.trim()) {
    return defaultOrigin;
  }

  const normalized = input.trim().toLowerCase();
  return (
    knownOrigins.find(
      (origin) =>
        origin.label.toLowerCase() === normalized || origin.code.toLowerCase() === normalized
    ) ?? {
      ...defaultOrigin,
      label: input.trim(),
      code: input.trim().slice(0, 3).toUpperCase() || defaultOrigin.code
    }
  );
}

function parseDays(prompt: string, fallback = 12) {
  const match = prompt.match(/(\d{1,2})\s*days?/i);
  return match ? Number(match[1]) : fallback;
}

function parseStops(prompt: string, fallback = 1) {
  if (/direct only/i.test(prompt)) {
    return 0;
  }

  const match = prompt.match(/(?:max|up to)\s*(\d)\s*stops?/i);
  return match ? Number(match[1]) : fallback;
}

function parseRouteType(prompt: string, fallback: RouteType = "round_trip"): RouteType {
  if (/\b(one[- ]way|open[- ]jaw)\b/i.test(prompt)) {
    return "one_way";
  }

  if (/\b(round[- ]trip|return|back to|come back)\b/i.test(prompt)) {
    return "round_trip";
  }

  return fallback;
}

function inferVibe(prompt: string) {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("jungle")) {
    return "jungle";
  }
  if (normalized.includes("surf")) {
    return "coastal";
  }
  if (normalized.includes("mountain")) {
    return "alpine";
  }

  return "adventure";
}

function collectTags(prompt: string, explicitTags: string[] = []): WishTag[] {
  const normalized = prompt.toLowerCase();
  const discovered = new Set<WishTag>();

  explicitTags.forEach((tag) => {
    if (tag in tagKeywords) {
      discovered.add(tag as WishTag);
    }
  });

  Object.entries(tagKeywords).forEach(([tag, keywords]) => {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      discovered.add(tag as WishTag);
    }
  });

  return Array.from(discovered);
}

function collectExclusions(prompt: string) {
  const exclusions = new Set<string>();

  unsupportedSafetyPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(prompt)) {
      exclusions.add(message);
    }
  });

  return Array.from(exclusions);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function interpretTripIntent(input: TripIntentInput): TripIntent {
  const prompt = input.prompt.trim();
  const wishTags = collectTags(prompt, input.wishTags);

  return {
    prompt,
    origin: inferOrigin(input.origin),
    routeType: input.routeType ?? parseRouteType(prompt),
    tripLengthDays: clamp(input.tripLengthDays ?? parseDays(prompt), 4, 30),
    maxStops: clamp(input.maxStops ?? parseStops(prompt), 0, 2),
    departureDate: input.departureDate ?? null,
    wishTags,
    budgetMode: input.budgetMode ?? "balanced",
    vibe: inferVibe(prompt),
    exclusions: collectExclusions(prompt)
  };
}
