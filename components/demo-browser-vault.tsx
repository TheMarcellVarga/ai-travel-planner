"use client";

import { useMemo, useSyncExternalStore } from "react";

import { ResilientImage } from "@/components/resilient-image";
import { getDestinationMedia } from "@/lib/media";
import { formatRouteTagline, routePriceLabel } from "@/lib/planner/display";
import {
  readDemoBrowserShares,
  readDemoBrowserVault,
  DEMO_BROWSER_SHARES_KEY,
  DEMO_BROWSER_VAULT_KEY,
  type DemoBrowserShare
} from "@/lib/store/demo-browser-vault";
import type { RouteOption } from "@/lib/types";

function subscribeToBrowserStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function useBrowserStorageValue(key: string) {
  return useSyncExternalStore(
    subscribeToBrowserStorage,
    () => window.localStorage.getItem(key),
    () => null
  );
}

export function DemoBrowserRoutes() {
  const serializedRoutes = useBrowserStorageValue(DEMO_BROWSER_VAULT_KEY);
  const routes = useMemo<RouteOption[]>(
    () =>
      readDemoBrowserVault({
        getItem: () => serializedRoutes
      }),
    [serializedRoutes]
  );

  if (!routes.length) {
    return (
      <p className="muted-copy">
        No browser-local routes yet. Generate in the planner and save a route
        to keep it on this device.
      </p>
    );
  }

  return routes.map((route) => (
    <article className="stop-card vault-route-card" key={route.id}>
      <div className="card-header">
        <div>
          <strong className="card-title">{route.title}</strong>
          <span className="card-price">{routePriceLabel(route)}</span>
        </div>
        <ResilientImage
          alt=""
          src={getDestinationMedia(route.promotedStopId).src}
          className="card-image-sm"
          width={80}
          height={60}
        />
      </div>
      <p className="muted-copy text-small vault-route-card__tagline">
        {formatRouteTagline(route.tagline)}
      </p>
    </article>
  ));
}

export function DemoBrowserShares() {
  const serializedShares = useBrowserStorageValue(DEMO_BROWSER_SHARES_KEY);
  const shares = useMemo<DemoBrowserShare[]>(
    () =>
      readDemoBrowserShares({
        getItem: () => serializedShares
      }),
    [serializedShares]
  );

  if (!shares.length) {
    return (
      <p className="muted-copy">
        No preview links yet. Publish from the planner to create a validated,
        stateless demo share.
      </p>
    );
  }

  return shares.map((share) => (
    <article className="stop-card vault-route-card" key={share.id}>
      <div className="card-header">
        <div>
          <strong className="card-title">{share.title}</strong>
        </div>
        <ResilientImage
          alt=""
          src={getDestinationMedia(share.promotedStopId).src}
          className="card-image-sm"
          width={80}
          height={60}
        />
      </div>
      <a
        className="button button-ghost layout-fill text-small vault-route-card__link"
        href={share.shareUrl}
      >
        Open preview share
      </a>
    </article>
  ));
}
