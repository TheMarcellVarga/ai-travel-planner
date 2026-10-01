type MediaKind = "image" | "video";

export type MediaAsset = {
  kind: MediaKind;
  src: string;
  poster?: string;
  alt: string;
  title: string;
  author: string;
  sourceUrl: string;
  licenseLabel: string;
  licenseUrl: string;
};

type DestinationMedia = MediaAsset & {
  location: string;
  punchline: string;
};

export type RouteDisplayMedia = MediaAsset & {
  punchline: string;
};

const unsplashImage = (photoId: string, width = 1800) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=82`;

const unsplashLicense = {
  licenseLabel: "Unsplash License",
  licenseUrl: "https://unsplash.com/license"
};

export const heroMedia: MediaAsset = {
  kind: "image",
  src: unsplashImage("photo-1759055292398-312034ce4595", 2400),
  alt: "Lush Bali rice terraces with a waterfall dropping behind them.",
  title: "Lush green rice terraces with a waterfall",
  author: "Seraina Larissa",
  sourceUrl:
    "https://unsplash.com/photos/lush-green-rice-terraces-with-a-waterfall-in-the-background-YQVX3RyCvWg",
  ...unsplashLicense
};

export const kineticMedia: MediaAsset = {
  kind: "image",
  src: unsplashImage("photo-1757440156710-574dcfae0bcc", 1800),
  alt: "Madeira coastal cliffs with a waterfall dropping toward the ocean.",
  title: "Coastal cliffs with a waterfall cascading into the ocean",
  author: "Mick Waanders",
  sourceUrl:
    "https://unsplash.com/photos/coastal-cliffs-with-a-waterfall-cascading-into-the-ocean-Ael_O98yBwI",
  ...unsplashLicense
};

export const destinationMedia: Record<string, DestinationMedia> = {
  bali: {
    kind: "image",
    src: "/editorial/destinations/bali.jpg",
    alt: "Layered green rice terraces in Ubud, Bali.",
    title: "Rice terraces",
    author: "Radoslav Bali",
    sourceUrl: "https://unsplash.com/photos/rice-terraces-jN9JnZ-SyVc",
    ...unsplashLicense,
    location: "Bali, Indonesia",
    punchline: "Waterfall humidity, terraced green, and jungle-route excess."
  },
  "chiang-mai": {
    kind: "image",
    src: "/editorial/destinations/chiang-mai.jpg",
    alt: "A Thai mountain temple rising from steep forested rock.",
    title: "Temple on top of the mountain",
    author: "Nopparuj Lamaikul",
    sourceUrl:
      "https://unsplash.com/photos/a-view-of-a-mountain-with-a-temple-on-top-of-it-D7owOqY5WVg",
    ...unsplashLicense,
    location: "Chiang Mai, Thailand",
    punchline: "Temple gold, mountain loops, and remote-worker trail access."
  },
  "da-nang": {
    kind: "image",
    src: "/editorial/destinations/da-nang.jpg",
    alt: "My Khe Beach in Da Nang with skyline and mountains in the distance.",
    title: "Beach with city skyline and mountains",
    author: "Quang Tran",
    sourceUrl:
      "https://unsplash.com/photos/beach-with-city-skyline-and-mountains-in-background-nLH08BnLB3Y",
    ...unsplashLicense,
    location: "Da Nang, Vietnam",
    punchline: "Beachfront lift, mountain backdrop, and fast coastal exits."
  },
  "cape-town": {
    kind: "image",
    src: "/editorial/destinations/cape-town.jpg",
    alt: "Dramatic sunset over the ocean with Table Mountain in silhouette.",
    title: "Dramatic sunset over the ocean with Table Mountain",
    author: "Marlin Clark",
    sourceUrl:
      "https://unsplash.com/photos/dramatic-sunset-over-the-ocean-with-table-mountain-6gn7jdejEoQ",
    ...unsplashLicense,
    location: "Cape Town, South Africa",
    punchline: "Table Mountain scale and ocean-edge contrast that sells itself."
  },
  tbilisi: {
    kind: "image",
    src: "/editorial/destinations/tbilisi.jpg",
    alt: "Tbilisi's river, bridge, cable cars, and old town rising up a green hill.",
    title: "River with bridge and old town on hill",
    author: "Rama Krushna Behera",
    sourceUrl:
      "https://unsplash.com/photos/river-with-bridge-and-old-town-on-hill-bjbBlbX-XEg",
    ...unsplashLicense,
    location: "Tbilisi, Georgia",
    punchline: "Rooftop texture, hillside density, and crypto-nomad mystique."
  },
  medellin: {
    kind: "image",
    src: "/editorial/destinations/medellin.jpg",
    alt: "Medellin suburbs and mountain valley seen from a cable car.",
    title: "A scenic view of a valley and mountains",
    author: "Jan Brennenstuhl",
    sourceUrl:
      "https://unsplash.com/photos/a-scenic-view-of-a-valley-and-mountains-x_3-flSAKS0",
    ...unsplashLicense,
    location: "Medellin, Colombia",
    punchline: "City heat wrapped in mountains, built for late-night route lust."
  },
  queenstown: {
    kind: "image",
    src: "/editorial/destinations/queenstown.jpg",
    alt: "Queenstown lake water surrounded by steep alpine mountains.",
    title: "A lake surrounded by mountains",
    author: "Zac Smith",
    sourceUrl:
      "https://unsplash.com/photos/a-lake-surrounded-by-mountains-cuG2T8qKA9o",
    ...unsplashLicense,
    location: "Queenstown, New Zealand",
    punchline: "Cold lake sheen and full-send alpine MTB energy."
  },
  madeira: {
    kind: "image",
    src: "/editorial/destinations/madeira.jpg",
    alt: "Madeira coastal cliffs with a waterfall dropping toward the ocean.",
    title: "Coastal cliffs with a waterfall cascading into the ocean",
    author: "Mick Waanders",
    sourceUrl:
      "https://unsplash.com/photos/coastal-cliffs-with-a-waterfall-cascading-into-the-ocean-Ael_O98yBwI",
    ...unsplashLicense,
    location: "Madeira, Portugal",
    punchline: "Cliff-road vertigo, ocean drops, and levada-line tension."
  },
  tulum: {
    kind: "image",
    src: "/editorial/destinations/tulum.jpg",
    alt: "Tulum's rocky coastline with Mayan ruins above the ocean.",
    title: "A rocky cliff overlooking the ocean with a tower in the distance",
    author: "Austin Kindred",
    sourceUrl:
      "https://unsplash.com/photos/a-rocky-cliff-overlooking-the-ocean-with-a-tower-in-the-distance-GS9O2wOz0DA",
    ...unsplashLicense,
    location: "Tulum, Mexico",
    punchline: "Ruins over electric water, pure social-first temptation."
  }
};

export const expeditionIndex = [
  "bali",
  "chiang-mai",
  "da-nang",
  "cape-town",
  "tbilisi",
  "medellin",
  "queenstown",
  "madeira",
  "tulum"
] as const;

export function getDestinationMedia(destinationId: string) {
  return destinationMedia[destinationId] ?? destinationMedia.bali;
}

export function getRouteStopMedia(stop?: {
  id: string;
  name: string;
  scene?: string;
  media?: {
    imageUrl: string;
    sourceUrl: string;
    title: string;
    creator: string;
    licenseLabel: string;
    licenseUrl: string;
  } | null;
}): RouteDisplayMedia {
  const destinationImage = stop ? destinationMedia[stop.id] : null;
  if (
    destinationImage &&
    (!stop?.media || stop.media.imageUrl === "/editorial/route-ribbon-hero.png")
  ) {
    return {
      ...destinationImage,
      punchline: stop?.scene ?? destinationImage.punchline
    };
  }

  if (stop?.media) {
    return {
      kind: "image",
      src: stop.media.imageUrl,
      alt: `${stop.name}: ${stop.media.title}`,
      title: stop.media.title,
      author: stop.media.creator,
      sourceUrl: stop.media.sourceUrl,
      licenseLabel: stop.media.licenseLabel,
      licenseUrl: stop.media.licenseUrl,
      punchline: stop.scene ?? "A route stop selected for the shape of the journey."
    };
  }

  return {
    kind: "image",
    src: "/editorial/route-ribbon-hero.png",
    alt: `${stop?.name ?? "Route stop"}: Wild Route local artwork`,
    title: `${stop?.name ?? "Route stop"} route study`,
    author: "Wild Route",
    sourceUrl: "https://github.com/TheMarcellVarga/ai-travel-planner",
    licenseLabel: "Wild Route local artwork",
    licenseUrl: "https://github.com/TheMarcellVarga/ai-travel-planner",
    punchline: stop?.scene ?? "A route stop selected for the shape of the journey."
  };
}
