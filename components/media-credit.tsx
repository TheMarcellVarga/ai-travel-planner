import type { MediaAsset } from "@/lib/media";

type MediaCreditProps = {
  asset: MediaAsset;
  compact?: boolean;
};

export function MediaCredit({ asset, compact = false }: MediaCreditProps) {
  return (
    <p className={compact ? "media-credit media-credit-compact" : "media-credit"}>
      Media:{" "}
      <a href={asset.sourceUrl} rel="noreferrer" target="_blank">
        {asset.title}
      </a>{" "}
      by {asset.author}.{" "}
      <a href={asset.licenseUrl} rel="noreferrer" target="_blank">
        {asset.licenseLabel}
      </a>
      .
    </p>
  );
}
