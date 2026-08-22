import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AgentRunMetadata,
  BookingHandoff,
  BookingLink,
  PublicSharedRoute,
  RouteMediaAsset,
  RouteOption,
  SavedRoute,
  SharedRoute,
  TripGeneration
} from "@/lib/types";
import { createPublicSharedRoute } from "@/lib/store/public-share";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteGenerationRow = {
  id: string;
  prompt: string;
  trip_intent: TripGeneration["tripIntent"];
  routes: RouteOption[];
  created_at: string;
};

type SavedRouteRow = {
  id: string;
  user_id: string;
  generation_id: string;
  route: RouteOption;
  created_at: string;
};

type SharedRouteRow = {
  id: string;
  user_id: string;
  generation_id: string;
  slug: string;
  route: RouteOption;
  created_at: string;
};

type PublicSharedRouteRow = {
  id: string;
  slug: string;
  route: RouteOption;
  created_at: string;
};

type BookingHandoffRow = {
  id: string;
  user_id: string | null;
  route_id: string;
  links: BookingLink[];
  created_at: string;
};

type RouteAgentRunRow = {
  id: string;
  user_id: string | null;
  generation_id: string | null;
  mode: AgentRunMetadata["mode"];
  status: AgentRunMetadata["status"];
  agent_version: string;
  model_id: string | null;
  latency_ms: number;
  created_at: string;
};

function isPersistentUser(userId: string | null | undefined) {
  return Boolean(userId && !userId.startsWith("demo:"));
}

function mapGeneration(row: RouteGenerationRow): TripGeneration {
  return {
    id: row.id,
    createdAt: row.created_at,
    tripIntent: row.trip_intent,
    routes: row.routes
  };
}

function mapSavedRoute(row: SavedRouteRow): SavedRoute {
  return {
    id: row.id,
    userId: row.user_id,
    generationId: row.generation_id,
    route: row.route,
    savedAt: row.created_at
  };
}

function mapSharedRoute(row: SharedRouteRow): SharedRoute {
  return {
    id: row.id,
    userId: row.user_id,
    generationId: row.generation_id,
    slug: row.slug,
    route: row.route,
    publishedAt: row.created_at
  };
}

function createSlug(route: RouteOption) {
  return `${route.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${route.id.slice(-5)}`;
}

export async function saveGenerationToDatabase(
  generation: TripGeneration,
  userId: string | null | undefined
) {
  if (!isPersistentUser(userId)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("route_generations")
    .insert({
      user_id: userId,
      prompt: generation.tripIntent.prompt,
      trip_intent: generation.tripIntent,
      routes: generation.routes
    })
    .select("id, prompt, trip_intent, routes, created_at")
    .single<RouteGenerationRow>();

  if (error || !data) {
    return null;
  }

  return mapGeneration(data);
}

export async function saveRouteAgentRunToDatabase(
  generation: TripGeneration,
  userId: string | null | undefined,
  persistedGenerationId = generation.id
) {
  if (!isPersistentUser(userId) || !generation.agentRun) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("route_agent_runs")
    .insert({
      user_id: userId,
      generation_id: persistedGenerationId,
      mode: generation.agentRun.mode,
      status: generation.agentRun.status,
      agent_version: generation.agentRun.agentVersion,
      model_id: generation.agentRun.modelId ?? null,
      latency_ms: Math.round(generation.agentRun.latencyMs)
    })
    .select("id, user_id, generation_id, mode, status, agent_version, model_id, latency_ms, created_at")
    .single<RouteAgentRunRow>();

  return data
    ? {
        mode: data.mode,
        status: data.status,
        agentVersion: data.agent_version,
        modelId: data.model_id ?? undefined,
        latencyMs: data.latency_ms
      }
    : null;
}

export async function getDestinationMediaFromDatabase(destinationId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("destination_media")
    .select("provider, image_url, source_url, title, creator, license_label, license_url, attribution_text, fetched_at")
    .eq("destination_id", destinationId)
    .gt("expires_at", new Date().toISOString())
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      provider: RouteMediaAsset["provider"];
      image_url: string;
      source_url: string;
      title: string;
      creator: string;
      license_label: string;
      license_url: string;
      attribution_text: string;
      fetched_at: string;
    }>();

  return data
    ? {
        provider: data.provider,
        imageUrl: data.image_url,
        sourceUrl: data.source_url,
        title: data.title,
        creator: data.creator,
        licenseLabel: data.license_label,
        licenseUrl: data.license_url,
        attributionText: data.attribution_text,
        fetchedAt: data.fetched_at
      }
    : null;
}

export async function saveDestinationMediaToDatabase(
  destinationId: string,
  asset: RouteMediaAsset
) {
  if (asset.provider === "local-fallback") {
    return null;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return null;
  }

  await admin.from("destination_media").upsert(
    {
      id: `${asset.provider}:${destinationId}`,
      destination_id: destinationId,
      provider: asset.provider,
      image_url: asset.imageUrl,
      source_url: asset.sourceUrl,
      title: asset.title,
      creator: asset.creator,
      license_label: asset.licenseLabel,
      license_url: asset.licenseUrl,
      attribution_text: asset.attributionText,
      fetched_at: asset.fetchedAt,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  return asset;
}

export async function getGenerationCountForUserFromDatabase(userId: string) {
  if (!isPersistentUser(userId)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { count, error } = await supabase
    .from("route_generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    return null;
  }

  return count ?? 0;
}

export async function getLatestGenerationForUserFromDatabase(userId: string) {
  if (!isPersistentUser(userId)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("route_generations")
    .select("id, prompt, trip_intent, routes, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<RouteGenerationRow>();

  return data ? mapGeneration(data) : null;
}

export async function getGenerationFromDatabase(generationId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("route_generations")
    .select("id, prompt, trip_intent, routes, created_at")
    .eq("id", generationId)
    .maybeSingle<RouteGenerationRow>();

  return data ? mapGeneration(data) : null;
}

async function findRouteInOwnGenerations(routeId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("route_generations")
    .select("id, prompt, trip_intent, routes, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(40)
    .returns<RouteGenerationRow[]>();

  for (const row of data ?? []) {
    const route = row.routes.find((candidate) => candidate.id === routeId);
    if (route) {
      return { route, generationId: row.id };
    }
  }

  return null;
}

async function findRouteInSharedRoutes(routeId: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return null;
  }

  const { data } = await admin
    .from("shared_routes")
    .select("id, user_id, generation_id, slug, route, created_at")
    .order("created_at", { ascending: false })
    .limit(40)
    .returns<SharedRouteRow[]>();

  for (const row of data ?? []) {
    if (row.route.id === routeId) {
      return { route: row.route, generationId: row.generation_id };
    }
  }

  return null;
}

export async function findRouteInDatabase(routeId: string, userId?: string | null) {
  if (isPersistentUser(userId)) {
    const ownMatch = await findRouteInOwnGenerations(routeId, userId!);
    if (ownMatch) {
      return ownMatch;
    }
  }

  return findRouteInSharedRoutes(routeId);
}

export async function getSavedRoutesForUserFromDatabase(userId: string) {
  if (!isPersistentUser(userId)) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("saved_routes")
    .select("id, user_id, generation_id, route, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<SavedRouteRow[]>();

  return (data ?? []).map(mapSavedRoute);
}

export async function saveRouteForUserInDatabase(userId: string, routeId: string) {
  if (!isPersistentUser(userId)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const existingRoutes = await getSavedRoutesForUserFromDatabase(userId);
  const existing = existingRoutes.find((savedRoute) => savedRoute.route.id === routeId);
  if (existing) {
    return existing;
  }

  const routeMatch = await findRouteInOwnGenerations(routeId, userId);
  if (!routeMatch) {
    return null;
  }

  const { data } = await supabase
    .from("saved_routes")
    .insert({
      user_id: userId,
      generation_id: routeMatch.generationId,
      route: routeMatch.route
    })
    .select("id, user_id, generation_id, route, created_at")
    .single<SavedRouteRow>();

  return data ? mapSavedRoute(data) : null;
}

export async function publishRouteForUserInDatabase(userId: string, routeId: string) {
  if (!isPersistentUser(userId)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data: sharedRoutes } = await supabase
    .from("shared_routes")
    .select("id, user_id, generation_id, slug, route, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<SharedRouteRow[]>();

  const existing = (sharedRoutes ?? []).find((row) => row.route.id === routeId);
  if (existing) {
    return mapSharedRoute(existing);
  }

  const routeMatch = await findRouteInOwnGenerations(routeId, userId);
  if (!routeMatch) {
    return null;
  }

  const { data } = await supabase
    .from("shared_routes")
    .insert({
      user_id: userId,
      generation_id: routeMatch.generationId,
      slug: createSlug(routeMatch.route),
      route: routeMatch.route
    })
    .select("id, user_id, generation_id, slug, route, created_at")
    .single<SharedRouteRow>();

  return data ? mapSharedRoute(data) : null;
}

export async function getSharedRouteFromDatabase(slug: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("shared_routes")
    .select("id, user_id, generation_id, slug, route, created_at")
    .eq("slug", slug)
    .maybeSingle<SharedRouteRow>();

  return data ? mapSharedRoute(data) : null;
}

export async function getPublicSharedRouteFromDatabase(
  slug: string
): Promise<PublicSharedRoute | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return null;
  }

  const { data } = await admin
    .from("shared_routes")
    .select("id, slug, route, created_at")
    .eq("slug", slug)
    .maybeSingle<PublicSharedRouteRow>();

  if (!data) {
    return null;
  }

  return createPublicSharedRoute({
    id: data.id,
    userId: "public-redacted",
    generationId: "public-redacted",
    slug: data.slug,
    route: data.route,
    publishedAt: data.created_at
  });
}

export async function getSharedRoutesForUserFromDatabase(userId: string) {
  if (!isPersistentUser(userId)) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("shared_routes")
    .select("id, user_id, generation_id, slug, route, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<SharedRouteRow[]>();

  return (data ?? []).map(mapSharedRoute);
}

export async function recordHandoffInDatabase(
  routeId: string,
  userId: string | null | undefined,
  links: BookingLink[]
): Promise<BookingHandoff | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("booking_handoffs")
    .insert({
      route_id: routeId,
      user_id: isPersistentUser(userId) ? userId : null,
      links
    })
    .select("id, user_id, route_id, links, created_at")
    .single<BookingHandoffRow>();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    routeId: data.route_id,
    userId: data.user_id,
    createdAt: data.created_at,
    links: data.links
  };
}
