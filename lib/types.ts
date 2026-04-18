import type { wishTags } from "@/lib/site";

export type WishTag = (typeof wishTags)[number];

export type BudgetMode = "value" | "balanced" | "comfort";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type OriginProfile = {
  label: string;
  code: string;
  coordinates: Coordinates;
  country: string;
};

export type TripIntent = {
  prompt: string;
  origin: OriginProfile;
  tripLengthDays: number;
  maxStops: number;
  wishTags: WishTag[];
  budgetMode: BudgetMode;
  vibe: string;
  exclusions: string[];
};

export type DestinationProfile = {
  id: string;
  name: string;
  code: string;
  country: string;
  region: string;
  coordinates: Coordinates;
  tags: WishTag[];
  scene: string;
  imageHint: string;
  baseCostUsd: number;
  comfortCostUsd: number;
  cryptoFriendly: boolean;
  activityScore: number;
};

export type RouteStop = {
  id: string;
  name: string;
  code: string;
  country: string;
  kind: "origin" | "destination";
  coordinates: Coordinates;
  tags: WishTag[];
  scene?: string;
  imageHint?: string;
};

export type BookingLink = {
  id: string;
  provider: string;
  label: string;
  url: string;
  kind: "route" | "leg" | "stay";
};

export type RouteOption = {
  id: string;
  title: string;
  tagline: string;
  vibe: string;
  promotedStopId: string;
  score: number;
  confidence: number;
  estimatedCostUsd: number;
  reasons: string[];
  wishTags: WishTag[];
  stops: RouteStop[];
  bookingLinks: BookingLink[];
};

export type TripGeneration = {
  id: string;
  createdAt: string;
  tripIntent: TripIntent;
  routes: RouteOption[];
};

