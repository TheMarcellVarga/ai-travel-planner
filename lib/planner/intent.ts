import { defaultOrigin, knownOrigins } from "@/lib/data/destinations";
import type { BudgetMode, OriginProfile, TripIntent, WishTag } from "@/lib/types";

type TripIntentInput = {
  prompt: string;
  origin?: string;
  tripLengthDays?: number;
  maxStops?: number;
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

export function interpretTripIntent(input: TripIntentInput): TripIntent {
  const prompt = input.prompt.trim();
  const wishTags = collectTags(prompt, input.wishTags);

  return {
    prompt,
    origin: inferOrigin(input.origin),
    tripLengthDays: input.tripLengthDays ?? parseDays(prompt),
    maxStops: input.maxStops ?? parseStops(prompt),
    wishTags,
    budgetMode: input.budgetMode ?? "balanced",
    vibe: inferVibe(prompt),
    exclusions: []
  };
}

