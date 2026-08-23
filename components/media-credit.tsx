import React from "react";

import type { MediaAsset } from "@/lib/media";

type MediaCreditProps = {
  asset: MediaAsset;
  compact?: boolean;
};

export function MediaCredit({ asset, compact = false }: MediaCreditProps) {
  const accessibleCredit = `Source. ${asset.title} by ${asset.author}. ${asset.licenseLabel}.`;

  return (
    <p className={compact ? "media-credit media-credit-compact" : "media-credit"}>
      <span className="media-credit__popover">
        <a
          aria-label={accessibleCredit}
          className="media-credit__trigger"
          href={asset.sourceUrl}
          rel="noreferrer"
          target="_blank"
          title={accessibleCredit}
        >
          Source
        </a>
        <span className="media-credit__tooltip" role="tooltip">
          <span>{asset.title}</span>
          <span>
            by {asset.author}.{" "}
            <a href={asset.licenseUrl} rel="noreferrer" target="_blank">
              {asset.licenseLabel}
            </a>
            .
          </span>
        </span>
      </span>
    </p>
  );
}
