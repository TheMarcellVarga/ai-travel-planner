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
  publicView?: boolean;
};

type HandoffResponse = {
  links: Array<{ url: string }>;
};

type ActionResponse = HandoffResponse & {
  error?: string;
  shareUrl?: string;
  persistence?: { durable: boolean };
};

export function RouteActions({ routeId, route, tripIntent, publicView = false }: RouteActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [actionHref, setActionHref] = useState<string | null>(null);
  const [actionLabel, setActionLabel] = useState("Open share");
  const [isPending, startTransition] = useTransition();

  function runAction(
    path: string,
    successMessage: (payload: ActionResponse) => string,
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
          body: JSON.stringify({ route, tripIntent }),
          signal: AbortSignal.timeout(20_000)
        });
        const payload = (await response.json().catch(() => ({}))) as ActionResponse;

        if (!response.ok) {
          if (response.status === 401) {
            setMessage("Enter demo mode or sign in to save and share routes.");
            setActionHref("/auth");
            setActionLabel("Continue");
          } else {
            setMessage(payload.error ?? "This action failed. Try again.");
          }
          return;
        }

        if (openFirstLink) {
          const firstLink = payload.links?.[0]?.url;
          if (!firstLink) {
            setMessage("Flight search is unavailable for this route. Try again later.");
            return;
          }
          if (firstLink) {
            setActionHref(firstLink);
            setActionLabel("Continue to flight search");
          }
        }

        if (saveInBrowser && route && !payload.persistence?.durable) {
          saveDemoRouteToBrowser(window.localStorage, route);
        }

        if (path.endsWith("/publish") && !payload.shareUrl) {
          setMessage("A share link could not be created. Try again.");
          return;
        }

        if (path.endsWith("/publish") && route && payload.shareUrl) {
          saveDemoShareToBrowser(window.localStorage, route, payload.shareUrl);
          setActionHref(payload.shareUrl);
          setActionLabel("Open share");
        }

        setMessage(successMessage(payload));
      } catch {
        setMessage("Could not finish this action. Please try again.");
      }
    });
  }

  return (
    <details className="route-studio-actions">
      <summary className="route-studio-actions__summary">
        <span>{publicView ? "Flight search" : "Save & share"}</span>
        <small>{isPending ? "Working…" : ""}</small>
      </summary>
      <div className="route-studio-actions__body">
        {!publicView ? <div className="route-studio-actions__secondary">
          <button
            className="route-studio-actions__secondary-button"
            disabled={isPending}
            onClick={() =>
              runAction(
                `/api/routes/${routeId}/save`,
                (payload) => payload.persistence?.durable ? "Saved to your account." : "Saved in this browser's demo vault.",
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
                () => "Your route preview is ready."
              )
            }
            type="button"
          >
            Publish
          </button>
        </div> : null}
        {publicView ? <button
          className="route-studio-actions__primary-button"
          disabled={isPending}
          onClick={() =>
            runAction(`/api/routes/${routeId}/handoff`, () => "Flight search is ready. Prices and availability are confirmed by the provider.", true)
          }
          type="button"
        >
          Open booking handoff
        </button> : null}
        {message ? (
          <p className="route-studio-actions__message" role="status" aria-live="polite">
            {message}{" "}
            {actionHref ? <a href={actionHref} target={actionHref.startsWith("http") ? "_blank" : undefined} rel={actionHref.startsWith("http") ? "noopener noreferrer" : undefined}>{actionLabel}</a> : null}
          </p>
        ) : null}
      </div>
    </details>
  );
}
