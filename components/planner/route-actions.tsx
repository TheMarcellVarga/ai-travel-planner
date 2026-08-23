"use client";

import { useState, useTransition } from "react";

import {
  saveDemoRouteToBrowser,
  saveDemoShareToBrowser
} from "@/lib/store/demo-browser-vault";
import type { RouteOption, TripIntent } from "@/lib/types";

type RouteActionsProps = {
  routeId: string;
  route?: RouteOption;
  tripIntent?: TripIntent;
};

type HandoffResponse = {
  links: Array<{ url: string }>;
};

type ActionResponse = HandoffResponse & {
  error?: string;
  shareUrl?: string;
};

export function RouteActions({ routeId, route, tripIntent }: RouteActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [actionHref, setActionHref] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(
    path: string,
    successMessage: (payload: any) => string,
    openFirstLink = false,
    saveInBrowser = false
  ) {
    startTransition(async () => {
      setMessage(null);
      setActionHref(null);
      try {
        const response = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ route, tripIntent })
        });
        const payload = (await response.json().catch(() => ({}))) as ActionResponse;

        if (!response.ok) {
          setMessage(payload.error ?? "This action failed. Try again.");
          return;
        }

        if (openFirstLink) {
          const firstLink = payload.links?.[0]?.url;
          if (firstLink) {
            window.open(firstLink, "_blank", "noopener,noreferrer");
          }
        }

        if (saveInBrowser && route) {
          saveDemoRouteToBrowser(window.localStorage, route);
        }

        if (path.endsWith("/publish") && route && payload.shareUrl) {
          saveDemoShareToBrowser(window.localStorage, route, payload.shareUrl);
          setActionHref(payload.shareUrl);
        }

        setMessage(successMessage(payload));
      } catch {
        setMessage("The connection dropped before this action finished. Try again.");
      }
    });
  }

  return (
    <details className="route-studio-actions">
      <summary className="route-studio-actions__summary">
        <span>Decision tools</span>
        <small>{isPending ? "working" : "ready"}</small>
      </summary>
      <div className="route-studio-actions__body">
        <div className="route-studio-actions__secondary">
          <button
            className="route-studio-actions__secondary-button"
            disabled={isPending}
            onClick={() =>
              runAction(
                `/api/routes/${routeId}/save`,
                () => "Saved in this browser's demo vault.",
                false,
                true
              )
            }
            type="button"
          >
            Save
          </button>
          <button
            className="route-studio-actions__secondary-button"
            disabled={isPending}
            onClick={() =>
              runAction(
                `/api/routes/${routeId}/publish`,
                (payload) => `Published preview at ${payload.shareUrl}`
              )
            }
            type="button"
          >
            Publish
          </button>
        </div>
        <button
          className="route-studio-actions__primary-button"
          disabled={isPending}
          onClick={() =>
            runAction(`/api/routes/${routeId}/handoff`, () => "Opened booking handoff.", true)
          }
          type="button"
        >
          Open booking handoff
        </button>
        {message ? (
          <p className="route-studio-actions__message" role="status" aria-live="polite">
            {message}{" "}
            {actionHref ? <a href={actionHref}>Open share</a> : null}
          </p>
        ) : null}
      </div>
    </details>
  );
}
