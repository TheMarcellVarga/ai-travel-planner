"use client";

import Image, { type ImageProps } from "next/image";
import React, { useState } from "react";

type ResilientImageProps = ImageProps & {
  fallbackSrc?: ImageProps["src"];
};

const DEFAULT_FALLBACK_SRC = "/editorial/route-ribbon-hero.png";

export function ResilientImage({
  alt,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  onError,
  src,
  ...props
}: ResilientImageProps) {
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);
  const isDegraded = failedSrc === src;

  const degradedAlt = alt
    ? `${alt} Local Wild Route artwork is shown because the destination image is unavailable.`
    : "";

  return (
    <Image
      {...props}
      alt={isDegraded ? degradedAlt : alt}
      data-media-state={isDegraded ? "degraded" : "primary"}
      onError={(event) => {
        onError?.(event);
        if (!isDegraded) {
          setFailedSrc(src);
        }
      }}
      src={isDegraded ? fallbackSrc : src}
    />
  );
}
