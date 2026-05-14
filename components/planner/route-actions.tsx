"use client";

import { useState, useTransition } from "react";

type RouteActionsProps = {
  routeId: string;
};

type HandoffResponse = {
  links: Array<{ url: string }>;
};

export function RouteActions({ routeId }: RouteActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(path: string, successMessage: (payload: any) => string, openFirstLink = false) {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch(path, { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "This action failed.");
        return;
      }

      if (openFirstLink) {
        const handoffPayload = payload as HandoffResponse;
        const firstLink = handoffPayload.links[0]?.url;
        if (firstLink) {
          window.open(firstLink, "_blank", "noopener,noreferrer");
        }
      }

      setMessage(successMessage(payload));
    });
  }

  return (
    <div className="route-actions">
      <div className="route-actions__row">
        <button
          className="button button-ghost"
          disabled={isPending}
          onClick={() =>
            runAction(`/api/routes/${routeId}/save`, () => "Saved to your route vault.")
          }
          type="button"
        >
          Save
        </button>
        <button
          className="button button-ghost"
          disabled={isPending}
          onClick={() =>
            runAction(`/api/routes/${routeId}/publish`, (payload) => `Published at /share/${payload.slug}`)
          }
          type="button"
        >
          Publish
        </button>
      </div>
      <div className="route-actions__row route-actions__row-primary">
        <button
          className="button"
          disabled={isPending}
          onClick={() =>
            runAction(`/api/routes/${routeId}/handoff`, () => "Opened booking handoff.", true)
          }
          type="button"
        >
          Booking Handoff
        </button>
      </div>
      {message ? <p className="status-copy">{message}</p> : null}
    </div>
  );
}
