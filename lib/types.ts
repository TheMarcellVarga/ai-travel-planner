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

export type Entitlement = {
  plan: "free" | "pro";
  promotedStopLimit: number;
  routeSaveLimit: number;
  generationLimit: number;
};

export type AppUser = {
  id: string;
  email: string;
  name: string;
  authMode: "demo" | "supabase";
  entitlement: Entitlement;
};

export type SavedRoute = {
  id: string;
  userId: string;
  route: RouteOption;
  generationId: string;
  savedAt: string;
};

export type SharedRoute = {
  id: string;
  userId: string;
  slug: string;
  route: RouteOption;
  generationId: string;
  publishedAt: string;
};

export type BookingHandoff = {
  id: string;
  routeId: string;
  userId: string | null;
  createdAt: string;
  links: BookingLink[];
};
