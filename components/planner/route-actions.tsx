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
    <div className="route-studio-actions">
      <div className="route-studio-actions__header">
        <span>Decision tools</span>
        <small>{isPending ? "working" : "ready"}</small>
      </div>
      <div className="route-studio-actions__secondary">
        <button
          className="route-studio-actions__secondary-button"
          disabled={isPending}
          onClick={() =>
            runAction(`/api/routes/${routeId}/save`, () => "Saved to your route vault.")
          }
          type="button"
        >
          Save
        </button>
        <button
          className="route-studio-actions__secondary-button"
          disabled={isPending}
          onClick={() =>
            runAction(`/api/routes/${routeId}/publish`, (payload) => `Published at /share/${payload.slug}`)
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
      {message ? <p className="route-studio-actions__message">{message}</p> : null}
    </div>
  );
}
