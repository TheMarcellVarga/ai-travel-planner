import type {
  BookingHandoff,
  BookingLink,
  NewsletterSubscriber,
  NewsletterTopic,
  PublicSharedRoute,
  RouteOption,
  SavedRoute,
  SharedRoute,
  TripGeneration
} from "@/lib/types";
import { createPublicSharedRoute } from "@/lib/store/public-share";

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
    generationOwners: Map<string, string>;
    savedRoutes: Map<string, SavedRoute>;
    sharedRoutes: Map<string, SharedRoute>;
    handoffs: BookingHandoff[];
    newsletterSubscribers: Map<string, NewsletterSubscriber>;
  } | undefined;
}

export const ANONYMOUS_GENERATION_USER_ID = "anonymous";

function createStore() {
  if (!globalThis.__wildRouteStore__) {
    globalThis.__wildRouteStore__ = {
      generations: new Map<string, TripGeneration>(),
      generationOwners: new Map<string, string>(),
      savedRoutes: new Map<string, SavedRoute>(),
      sharedRoutes: new Map<string, SharedRoute>(),
      handoffs: [],
      newsletterSubscribers: new Map<string, NewsletterSubscriber>()
    };
  }

  return globalThis.__wildRouteStore__;
}

export function saveGeneration(
  generation: TripGeneration,
  userId: string | null | undefined = ANONYMOUS_GENERATION_USER_ID
) {
  const store = createStore();
  store.generations.set(generation.id, generation);
  store.generationOwners.set(generation.id, userId ?? ANONYMOUS_GENERATION_USER_ID);
  return generation;
}

export function getGeneration(generationId: string) {
  return createStore().generations.get(generationId) ?? null;
}

export function getLatestGenerationForUser(
  userId: string | null | undefined = ANONYMOUS_GENERATION_USER_ID
) {
  const ownerId = userId ?? ANONYMOUS_GENERATION_USER_ID;
  const store = createStore();
  const generations = Array.from(store.generations.values()).reverse();

  return (
    generations.find(
      (generation) => store.generationOwners.get(generation.id) === ownerId
    ) ?? null
  );
}

export function getGenerationCountForUser(
  userId: string | null | undefined = ANONYMOUS_GENERATION_USER_ID
) {
  const ownerId = userId ?? ANONYMOUS_GENERATION_USER_ID;
  let count = 0;

  for (const generationOwnerId of createStore().generationOwners.values()) {
    if (generationOwnerId === ownerId) {
      count += 1;
    }
  }

  return count;
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

function getOwnedOrAnonymousRoute(routeId: string, userId: string) {
  const store = createStore();

  for (const generation of store.generations.values()) {
    const ownerId = store.generationOwners.get(generation.id);
    if (ownerId !== userId && ownerId !== ANONYMOUS_GENERATION_USER_ID) {
      continue;
    }

    const route = generation.routes.find((item) => item.id === routeId);
    if (route) {
      return { route, generationId: generation.id };
    }
  }

  return null;
}

function getSharedRouteByRouteId(routeId: string) {
  for (const sharedRoute of createStore().sharedRoutes.values()) {
    if (sharedRoute.route.id === routeId) {
      return {
        route: sharedRoute.route,
        generationId: sharedRoute.generationId
      };
    }
  }

  return null;
}

export function getRouteForUserOrPublic(routeId: string, userId?: string | null) {
  if (userId) {
    const ownRoute = getOwnedOrAnonymousRoute(routeId, userId);
    if (ownRoute) {
      return ownRoute;
    }
  }

  return getSharedRouteByRouteId(routeId);
}

export function saveRouteForUser(userId: string, routeId: string) {
  const existing = Array.from(createStore().savedRoutes.values()).find(
    (savedRoute) => savedRoute.userId === userId && savedRoute.route.id === routeId
  );

  if (existing) {
    return existing;
  }

  const routeMatch = getOwnedOrAnonymousRoute(routeId, userId);
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
  const routeMatch = getOwnedOrAnonymousRoute(routeId, userId);
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

export function getPublicSharedRoute(slug: string): PublicSharedRoute | null {
  const sharedRoute = getSharedRoute(slug);
  return sharedRoute ? createPublicSharedRoute(sharedRoute) : null;
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
    generationOwners: new Map<string, string>(),
    savedRoutes: new Map<string, SavedRoute>(),
    sharedRoutes: new Map<string, SharedRoute>(),
    handoffs: [],
    newsletterSubscribers: new Map<string, NewsletterSubscriber>()
  };
}
