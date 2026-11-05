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

      try {
        const response = await fetch(path, { method: "POST" });
        const payload = await response.json();
        if (!response.ok || !payload.url) {
          setErrorMessage(payload.error ?? "Billing is unavailable. Try again later.");
          return;
        }
        window.location.assign(payload.url);
      } catch {
        setErrorMessage("Could not connect to billing. Try again later.");
      }
    });
  }

  if (!hasBilling) {
    return (
      <div className="button-row">
        <button className="button button-ghost" disabled type="button">Paid plans unavailable</button>
      </div>
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
