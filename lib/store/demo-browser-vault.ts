import { routeOptionSchema } from "@/lib/planner/schema";
import type { RouteOption } from "@/lib/types";

export const DEMO_BROWSER_VAULT_KEY = "wild-route:demo-vault:v1";
export const DEMO_BROWSER_SHARES_KEY = "wild-route:demo-shares:v1";
export const DEMO_BROWSER_VAULT_LIMIT = 12;

export type DemoBrowserShare = {
  id: string;
  title: string;
  tagline: string;
  promotedStopId: string;
  shareUrl: string;
};

function parseDemoShares(value: unknown): DemoBrowserShare[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is DemoBrowserShare =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.tagline === "string" &&
        typeof item.promotedStopId === "string" &&
        typeof item.shareUrl === "string" &&
        item.shareUrl.startsWith("/share/preview-")
    )
    .slice(0, DEMO_BROWSER_VAULT_LIMIT);
}

export function readDemoBrowserVault(storage: Pick<Storage, "getItem">): RouteOption[] {
  try {
    const value = storage.getItem(DEMO_BROWSER_VAULT_KEY);
    const parsed = value ? routeOptionSchema.array().safeParse(JSON.parse(value)) : null;
    return parsed?.success ? parsed.data.slice(0, DEMO_BROWSER_VAULT_LIMIT) : [];
  } catch {
    return [];
  }
}

export function saveDemoRouteToBrowser(
  storage: Pick<Storage, "getItem" | "setItem">,
  route: RouteOption
) {
  const current = readDemoBrowserVault(storage);
  const next = [route, ...current.filter((item) => item.id !== route.id)].slice(
    0,
    DEMO_BROWSER_VAULT_LIMIT
  );
  storage.setItem(DEMO_BROWSER_VAULT_KEY, JSON.stringify(next));
  return next;
}

export function readDemoBrowserShares(
  storage: Pick<Storage, "getItem">
): DemoBrowserShare[] {
  try {
    const value = storage.getItem(DEMO_BROWSER_SHARES_KEY);
    return value ? parseDemoShares(JSON.parse(value)) : [];
  } catch {
    return [];
  }
}

export function saveDemoShareToBrowser(
  storage: Pick<Storage, "getItem" | "setItem">,
  route: RouteOption,
  shareUrl: string
) {
  const current = readDemoBrowserShares(storage);
  const entry: DemoBrowserShare = {
    id: route.id,
    title: route.title,
    tagline: route.tagline,
    promotedStopId: route.promotedStopId,
    shareUrl
  };
  const next = [entry, ...current.filter((item) => item.id !== route.id)].slice(
    0,
    DEMO_BROWSER_VAULT_LIMIT
  );
  storage.setItem(DEMO_BROWSER_SHARES_KEY, JSON.stringify(next));
  return next;
}
