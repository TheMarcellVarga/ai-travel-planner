import type { DestinationProfile, RouteMediaAsset, RouteOption } from "@/lib/types";

export interface RouteMediaProvider {
  id: RouteMediaAsset["provider"];
  getMedia(destination: DestinationProfile): Promise<RouteMediaAsset>;
}

export type RouteMediaCache = {
  get(destinationId: string): Promise<RouteMediaAsset | null>;
  set(destinationId: string, asset: RouteMediaAsset): Promise<unknown>;
};

const LOCAL_SOURCE_URL = "https://github.com/TheMarcellVarga/ai-travel-planner";
const LOCAL_LICENSE_URL = "https://github.com/TheMarcellVarga/ai-travel-planner";
const DOCUMENT_LIKE_TERMS = [
  "book",
  "cover",
  "diagram",
  "document",
  "logo",
  "map",
  "poster",
  "report",
  "scan",
  "specimen"
] as const;
const SEARCH_STOP_WORDS = new Set([
  "above",
  "and",
  "behind",
  "cliffs",
  "coastal",
  "green",
  "haze",
  "ocean",
  "roads",
  "sea",
  "the",
  "with"
]);
type MediaDestinationContext = {
  name: string;
  country: string;
  region?: string;
  imageHint?: string;
};

function createLocalFallbackMedia(destination: Pick<DestinationProfile, "name">): RouteMediaAsset {
  return {
    provider: "local-fallback",
    imageUrl: "/editorial/route-ribbon-hero.png",
    sourceUrl: LOCAL_SOURCE_URL,
    title: `${destination.name} route study`,
    creator: "Wild Route",
    licenseLabel: "Wild Route local artwork",
    licenseUrl: LOCAL_LICENSE_URL,
    attributionText: `Wild Route local artwork for ${destination.name}`,
    fetchedAt: new Date().toISOString()
  };
}

function stripHtml(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchableText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(searchableText).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.values(value).map(searchableText).join(" ");
  }

  return stripHtml(value);
}

function normalizeSearchText(value: unknown) {
  return searchableText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function meaningfulSearchTokens(value: string) {
  return normalizeSearchText(value)
    .split(" ")
    .filter((token) => token.length > 2 && !SEARCH_STOP_WORDS.has(token));
}

function isDocumentLike(title: string, mime = "") {
  const normalized = normalizeSearchText(title);
  const normalizedMime = normalizeSearchText(mime);

  return (
    normalizedMime === "application pdf" ||
    /\b(?:pdf|djvu|docx?|pptx?|xlsx?)\b/.test(normalized) ||
    DOCUMENT_LIKE_TERMS.some((term) => new RegExp(`\\b${term}\\b`).test(normalized))
  );
}

function mediaRelevanceScore(destination: MediaDestinationContext, text: string) {
  const normalizedText = normalizeSearchText(text);
  const destinationName = normalizeSearchText(destination.name);
  const country = normalizeSearchText(destination.country);
  const region = normalizeSearchText(destination.region ?? "");
  const nameTokens = meaningfulSearchTokens(destination.name);
  const hintTokens = meaningfulSearchTokens(destination.imageHint ?? "");
  let score = 0;

  if (destinationName && normalizedText.includes(destinationName)) {
    score += 8;
  }

  if (country && normalizedText.includes(country)) {
    score += 3;
  }

  if (region && normalizedText.includes(region)) {
    score += 1;
  }

  score += nameTokens.filter((token) => normalizedText.includes(token)).length * 2;
  score += hintTokens.filter((token) => normalizedText.includes(token)).length * 2;

  return score;
}

function isRelevantMediaCandidate(destination: MediaDestinationContext, title: string, context: string) {
  if (isDocumentLike(title)) {
    return false;
  }

  return mediaRelevanceScore(destination, `${title} ${context}`) >= 3;
}

function isUsableMediaAsset(asset: RouteMediaAsset, destination: MediaDestinationContext) {
  if (asset.provider === "local-fallback") {
    return asset.imageUrl.startsWith("/") && Boolean(asset.title.trim());
  }

  return (
    isHttpUrl(asset.imageUrl) &&
    isHttpUrl(asset.sourceUrl) &&
    isHttpUrl(asset.licenseUrl) &&
    isAllowedLicense(asset.licenseLabel) &&
    isRelevantMediaCandidate(destination, asset.title, asset.attributionText)
  );
}

function isAllowedLicense(value: string) {
  const license = value.toLowerCase();
  if (license.includes("nc") || license.includes("nd")) {
    return false;
  }

  return (
    license.includes("public domain") ||
    license.includes("pdm") ||
    license.includes("cc0") ||
    license === "by" ||
    license === "by-sa" ||
    license.includes("cc by") ||
    license.includes("cc-by")
  );
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function licenseUrlFor(value: string, provided?: string) {
  if (provided) {
    return provided;
  }

  const normalized = value.toLowerCase().replace(/\s+/g, "-");
  if (normalized.includes("cc0") || normalized.includes("public-domain") || normalized === "pdm") {
    return "https://creativecommons.org/publicdomain/zero/1.0/";
  }

  return "https://creativecommons.org/licenses/by/4.0/";
}

function buildAttribution(title: string, creator: string, licenseLabel: string, provider: string) {
  return `${title} — ${creator} / ${licenseLabel} / ${provider}`;
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "WildRoute/0.1 (+https://github.com/TheMarcellVarga/ai-travel-planner)"
    },
    signal: AbortSignal.timeout(1800)
  });

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<Record<string, unknown>>;
}

async function searchWikimediaCommons(destination: DestinationProfile) {
  const query = encodeURIComponent(`${destination.name} ${destination.region} ${destination.imageHint}`);
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${query}` +
    "&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1400&format=json";
  const payload = await fetchJson(url);
  const pages = Object.values(
    (payload?.query as { pages?: Record<string, unknown> } | undefined)?.pages ?? {}
  ) as Array<Record<string, unknown>>;

  for (const page of pages) {
    const imageInfo = (page.imageinfo as Array<Record<string, unknown>> | undefined)?.[0];
    const metadata = (imageInfo?.extmetadata as Record<string, { value?: unknown }> | undefined) ?? {};
    const licenseLabel = stripHtml(metadata.LicenseShortName?.value ?? metadata.License?.value);
    const imageUrl = String(imageInfo?.thumburl ?? imageInfo?.url ?? "");
    const sourceUrl = String(imageInfo?.descriptionurl ?? "");
    const mime = String(imageInfo?.mime ?? "");
    const title = stripHtml(page.title).replace(/^File:\s*/i, "") || `${destination.name} image`;
    const metadataText = [
      metadata.ImageDescription?.value,
      metadata.ObjectName?.value,
      metadata.Categories?.value,
      metadata.Caption?.value
    ]
      .map(searchableText)
      .join(" ");

    if (
      !isHttpUrl(imageUrl) ||
      !isHttpUrl(sourceUrl) ||
      (mime && !mime.startsWith("image/")) ||
      !isAllowedLicense(licenseLabel) ||
      !isRelevantMediaCandidate(destination, title, metadataText)
    ) {
      continue;
    }

    const creator =
      stripHtml(metadata.Artist?.value ?? metadata.Credit?.value) ||
      "Wikimedia Commons contributor";

    return {
      provider: "wikimedia-commons" as const,
      imageUrl,
      sourceUrl,
      title,
      creator,
      licenseLabel,
      licenseUrl: licenseUrlFor(licenseLabel, stripHtml(metadata.LicenseUrl?.value)),
      attributionText: buildAttribution(title, creator, licenseLabel, "Wikimedia Commons"),
      fetchedAt: new Date().toISOString()
    } satisfies RouteMediaAsset;
  }

  return null;
}

async function searchOpenverse(destination: DestinationProfile) {
  const query = encodeURIComponent(`${destination.name} ${destination.region} ${destination.imageHint}`);
  const payload = await fetchJson(`https://api.openverse.org/v1/images/?q=${query}&page_size=8`);
  const results = (payload?.results as Array<Record<string, unknown>> | undefined) ?? [];

  for (const result of results) {
    const license = String(result.license ?? "");
    const imageUrl = String(result.thumbnail ?? result.url ?? "");
    const sourceUrl = String(result.foreign_landing_url ?? "");
    const mediaType = String(result.mediatype ?? "");

    if (
      !isHttpUrl(imageUrl) ||
      !isHttpUrl(sourceUrl) ||
      (mediaType && mediaType !== "image") ||
      !isAllowedLicense(license)
    ) {
      continue;
    }

    const title = String(result.title ?? `${destination.name} image`).trim();
    const creator = String(result.creator ?? "Openverse contributor").trim();
    const licenseLabel = String(result.license_version ? `${license} ${result.license_version}` : license).trim();
    const resultContext = [result.description, result.tags, result.category]
      .map(searchableText)
      .join(" ");

    const licenseUrl = String(result.license_url ?? licenseUrlFor(license));
    if (!isHttpUrl(licenseUrl)) {
      continue;
    }

    if (!isRelevantMediaCandidate(destination, title, resultContext)) {
      continue;
    }

    return {
      provider: "openverse" as const,
      imageUrl,
      sourceUrl,
      title,
      creator,
      licenseLabel: licenseLabel || "Open license",
      licenseUrl,
      attributionText: buildAttribution(title, creator, licenseLabel || "Open license", "Openverse"),
      fetchedAt: new Date().toISOString()
    } satisfies RouteMediaAsset;
  }

  return null;
}

export const fixtureRouteMediaProvider: RouteMediaProvider = {
  id: "local-fallback",
  async getMedia(destination) {
    return createLocalFallbackMedia(destination);
  }
};

export const openRouteMediaProvider: RouteMediaProvider = {
  id: "wikimedia-commons",
  async getMedia(destination) {
    try {
      const commonsMedia = await searchWikimediaCommons(destination);
      if (commonsMedia) {
        return commonsMedia;
      }

      const openverseMedia = await searchOpenverse(destination);
      if (openverseMedia) {
        return openverseMedia;
      }
    } catch {
      // Media is enrichment. A provider failure must never block route generation.
    }

    return createLocalFallbackMedia(destination);
  }
};

export const commonsRouteMediaProvider: RouteMediaProvider = {
  id: "wikimedia-commons",
  async getMedia(destination) {
    try {
      return (await searchWikimediaCommons(destination)) ?? createLocalFallbackMedia(destination);
    } catch {
      return createLocalFallbackMedia(destination);
    }
  }
};

export const openverseRouteMediaProvider: RouteMediaProvider = {
  id: "openverse",
  async getMedia(destination) {
    try {
      return (await searchOpenverse(destination)) ?? createLocalFallbackMedia(destination);
    } catch {
      return createLocalFallbackMedia(destination);
    }
  }
};

export function getRouteMediaProvider(): RouteMediaProvider {
  if (process.env.ROUTE_MEDIA_MODE === "fixture" || process.env.NODE_ENV === "test") {
    return fixtureRouteMediaProvider;
  }

  if (process.env.ROUTE_MEDIA_MODE === "commons") {
    return commonsRouteMediaProvider;
  }

  if (process.env.ROUTE_MEDIA_MODE === "openverse") {
    return openverseRouteMediaProvider;
  }

  return openRouteMediaProvider;
}

export async function enrichRoutesWithMedia(
  routes: RouteOption[],
  provider: RouteMediaProvider = getRouteMediaProvider(),
  cache?: RouteMediaCache
) {
  const destinationIds = Array.from(
    new Set(routes.flatMap((route) => route.stops.filter((stop) => stop.kind === "destination").map((stop) => stop.id)))
  );
  const mediaByDestination = new Map<string, RouteMediaAsset>();

  await Promise.all(
    destinationIds.map(async (destinationId) => {
      const destination = routes
        .flatMap((route) => route.stops)
        .find((stop) => stop.id === destinationId);
      if (!destination) {
        return;
      }

      const cachedCandidate =
        provider.id === "local-fallback"
          ? null
          : await Promise.race([
              cache?.get(destinationId) ?? Promise.resolve(null),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 350))
            ]);
      const cachedAsset =
        cachedCandidate && isUsableMediaAsset(cachedCandidate, destination)
          ? cachedCandidate
          : null;
      const asset =
        cachedAsset ??
        (await provider.getMedia({
        id: destination.id,
        name: destination.name,
        code: destination.code,
        country: destination.country,
        region: "route destination",
        coordinates: destination.coordinates,
        tags: destination.tags,
        scene: destination.scene ?? "",
        imageHint: destination.imageHint ?? destination.name,
        baseCostUsd: 0,
        comfortCostUsd: 0,
        cryptoFriendly: destination.tags.includes("crypto-friendly"),
        activityScore: 0
        }));
      const usableAsset = isUsableMediaAsset(asset, destination)
        ? asset
        : createLocalFallbackMedia(destination);
      if (!cachedAsset && usableAsset.provider !== "local-fallback" && provider.id !== "local-fallback") {
        void cache?.set(destinationId, usableAsset).catch(() => undefined);
      }
      mediaByDestination.set(destinationId, usableAsset);
    })
  );

  return routes.map((route) => ({
    ...route,
    stops: route.stops.map((stop) => ({
      ...stop,
      media: stop.kind === "destination" ? mediaByDestination.get(stop.id) ?? null : null
    }))
  }));
}
