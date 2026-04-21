"use client";

import { useState, useTransition } from "react";

type BillingActionsProps = {
  hasBilling: boolean;
  canManage: boolean;
};

export function BillingActions({
  hasBilling,
  canManage
}: BillingActionsProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(path: string) {
    startTransition(async () => {
      setErrorMessage(null);

      const response = await fetch(path, { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Billing is unavailable.");
        return;
      }

      if (payload.url) {
        window.location.assign(payload.url);
      }
    });
  }

  if (!hasBilling) {
    return (
      <p className="muted-copy">
        Add `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET`
        to activate paid plans.
      </p>
    );
  }

  return (
    <div className="button-row" style={{ flexDirection: "column", marginTop: "16px" }}>
      <button
        className="button"
        disabled={isPending}
        onClick={() => run("/api/billing/checkout")}
        type="button"
      >
        Upgrade To Pro
      </button>
      <button
        className="button button-ghost"
        disabled={isPending || !canManage}
        onClick={() => run("/api/billing/portal")}
        type="button"
      >
        Open Billing Portal
      </button>
      {errorMessage ? <p className="status-copy">{errorMessage}</p> : null}
    </div>
  );
}
