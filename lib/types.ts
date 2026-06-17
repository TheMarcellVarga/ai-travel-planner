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
  status: "external_search";
  disclaimer: string;
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
  estimateStatus: "planning_estimate";
  availabilityStatus: "external_search_required";
  dataFreshness: string;
  disclaimer: string;
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
  billingEmail?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodEnd?: string | null;
};

export type UserProfile = {
  userId: string;
  fullName: string;
  homeAirportCode: string | null;
  preferredCurrency: "USD" | "EUR" | "GBP" | "SGD";
  travelStyle: "balanced" | "budget" | "luxury" | "remote-work";
  newsletterOptIn: boolean;
  routeAlertsOptIn: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AppUser = {
  id: string;
  email: string;
  name: string;
  authMode: "demo" | "supabase";
  entitlement: Entitlement;
  profile: UserProfile | null;
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

export type NewsletterTopic = "newsletter" | "route_notifications";

export type NewsletterSubscriber = {
  id: string;
  email: string;
  name: string;
  topics: NewsletterTopic[];
  createdAt: string;
  updatedAt: string;
};
