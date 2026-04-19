import type {
  BookingHandoff,
  BookingLink,
  NewsletterSubscriber,
  NewsletterTopic,
  RouteOption,
  SavedRoute,
  SharedRoute,
  TripGeneration
} from "@/lib/types";

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

declare global {
  var __wildRouteStore__: {
    generations: Map<string, TripGeneration>;
    savedRoutes: Map<string, SavedRoute>;
    sharedRoutes: Map<string, SharedRoute>;
    handoffs: BookingHandoff[];
    newsletterSubscribers: Map<string, NewsletterSubscriber>;
  } | undefined;
}

function createStore() {
  if (!globalThis.__wildRouteStore__) {
    globalThis.__wildRouteStore__ = {
      generations: new Map<string, TripGeneration>(),
      savedRoutes: new Map<string, SavedRoute>(),
      sharedRoutes: new Map<string, SharedRoute>(),
      handoffs: [],
      newsletterSubscribers: new Map<string, NewsletterSubscriber>()
    };
  }

  return globalThis.__wildRouteStore__;
}

export function saveGeneration(generation: TripGeneration) {
  createStore().generations.set(generation.id, generation);
  return generation;
}

export function getGeneration(generationId: string) {
  return createStore().generations.get(generationId) ?? null;
}

export function getRoute(routeId: string) {
  for (const generation of createStore().generations.values()) {
    const route = generation.routes.find((item) => item.id === routeId);
    if (route) {
      return { route, generationId: generation.id };
    }
  }

  return null;
}

export function saveRouteForUser(userId: string, routeId: string) {
  const existing = Array.from(createStore().savedRoutes.values()).find(
    (savedRoute) => savedRoute.userId === userId && savedRoute.route.id === routeId
  );

  if (existing) {
    return existing;
  }

  const routeMatch = getRoute(routeId);
  if (!routeMatch) {
    return null;
  }

  const savedRoute: SavedRoute = {
    id: createId("saved"),
    userId,
    route: routeMatch.route,
    generationId: routeMatch.generationId,
    savedAt: new Date().toISOString()
  };

  createStore().savedRoutes.set(savedRoute.id, savedRoute);
  return savedRoute;
}

export function getSavedRoutesForUser(userId: string) {
  return Array.from(createStore().savedRoutes.values())
    .filter((route) => route.userId === userId)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function publishRouteForUser(userId: string, routeId: string) {
  const routeMatch = getRoute(routeId);
  if (!routeMatch) {
    return null;
  }

  const slug = `${slugify(routeMatch.route.title)}-${routeId.slice(-5)}`;
  const sharedRoute: SharedRoute = {
    id: createId("share"),
    userId,
    slug,
    route: routeMatch.route,
    generationId: routeMatch.generationId,
    publishedAt: new Date().toISOString()
  };

  createStore().sharedRoutes.set(slug, sharedRoute);
  return sharedRoute;
}

export function getSharedRoute(slug: string) {
  return createStore().sharedRoutes.get(slug) ?? null;
}

export function getSharedRoutesForUser(userId: string) {
  return Array.from(createStore().sharedRoutes.values())
    .filter((route) => route.userId === userId)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function recordHandoff(routeId: string, userId: string | null, links: BookingLink[]) {
  const handoff: BookingHandoff = {
    id: createId("handoff"),
    routeId,
    userId,
    createdAt: new Date().toISOString(),
    links
  };

  createStore().handoffs.push(handoff);
  return handoff;
}

export function subscribeNewsletter({
  email,
  name,
  topics
}: {
  email: string;
  name?: string;
  topics: NewsletterTopic[];
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const store = createStore();
  const existing = store.newsletterSubscribers.get(normalizedEmail);
  const now = new Date().toISOString();
  const currentTopics = new Set(existing?.topics ?? []);

  for (const topic of topics) {
    currentTopics.add(topic);
  }

  const subscriber: NewsletterSubscriber = {
    id: existing?.id ?? createId("newsletter"),
    email: normalizedEmail,
    name: name?.trim() || existing?.name || normalizedEmail.split("@")[0] || "Traveler",
    topics: Array.from(currentTopics),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  store.newsletterSubscribers.set(normalizedEmail, subscriber);

  return {
    subscriber,
    created: !existing,
    gainedTopics: Array.from(currentTopics).filter((topic) => !existing?.topics.includes(topic))
  };
}

export function getNewsletterSubscriber(email: string) {
  return createStore().newsletterSubscribers.get(email.trim().toLowerCase()) ?? null;
}

export function resetStore() {
  globalThis.__wildRouteStore__ = {
    generations: new Map<string, TripGeneration>(),
    savedRoutes: new Map<string, SavedRoute>(),
    sharedRoutes: new Map<string, SharedRoute>(),
    handoffs: [],
    newsletterSubscribers: new Map<string, NewsletterSubscriber>()
  };
}
