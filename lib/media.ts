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

const commonsFilePath = (fileName: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;

const ccBySa40 = {
  licenseLabel: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
};

const ccBySa30 = {
  licenseLabel: "CC BY-SA 3.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/"
};

const ccBySa20 = {
  licenseLabel: "CC BY-SA 2.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/"
};

const ccBy30 = {
  licenseLabel: "CC BY 3.0",
  licenseUrl: "https://creativecommons.org/licenses/by/3.0/"
};

export const heroMedia: MediaAsset = {
  kind: "video",
  src: commonsFilePath("File:Small waterfall.webm"),
  poster: commonsFilePath("File:Waterfall and jungle.jpg"),
  alt: "A dense jungle waterfall used as the landing page hero.",
  title: "Small waterfall",
  author: "YouTube user Editor via Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Small_waterfall.webm",
  ...ccBy30
};

export const kineticMedia: MediaAsset = {
  kind: "video",
  src: commonsFilePath("File:Mountain biking Downhill.webm"),
  poster: commonsFilePath("File:Mountain bike.JPG"),
  alt: "A downhill mountain biking sequence used as kinetic adventure media.",
  title: "Mountain biking Downhill",
  author: "Mountain Biking TV via Wikimedia Commons",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Mountain_biking_Downhill.webm",
  ...ccBy30
};

export const destinationMedia: Record<string, DestinationMedia> = {
  bali: {
    kind: "image",
    src: commonsFilePath("File:GitGit Waterfall, Bali.jpg"),
    alt: "A tall waterfall in Bali surrounded by jungle.",
    title: "GitGit Waterfall, Bali",
    author: "Ntup88",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:GitGit_Waterfall,_Bali.jpg",
    ...ccBySa40,
    location: "Bali, Indonesia",
    punchline: "Waterfall humidity, black rock, and jungle-green excess."
  },
  "chiang-mai": {
    kind: "image",
    src: commonsFilePath("File:Chiangmai temple.JPG"),
    alt: "A golden temple interior in Chiang Mai.",
    title: "Chiangmai temple",
    author: "CenkX",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Chiangmai_temple.JPG",
    ...ccBySa30,
    location: "Chiang Mai, Thailand",
    punchline: "Temple gold, mountain loops, and remote-worker trail access."
  },
  "da-nang": {
    kind: "image",
    src: commonsFilePath("File:Image of Da Nang beach.jpg"),
    alt: "Evening light over Da Nang beach.",
    title: "Image of Da Nang beach",
    author: "Ftfumuy926ascv",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Image_of_Da_Nang_beach.jpg",
    ...ccBySa40,
    location: "Da Nang, Vietnam",
    punchline: "Coastal glow, moonlit sand, and surf-route temptation."
  },
  "cape-town": {
    kind: "image",
    src: commonsFilePath("File:Cape Town Mountain.jpg"),
    alt: "A wide cinematic view of Table Mountain over Cape Town.",
    title: "Cape Town Mountain",
    author: "safaritravelplus",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Cape_Town_Mountain.jpg",
    ...ccBySa40,
    location: "Cape Town, South Africa",
    punchline: "Table Mountain scale and ocean-edge contrast that sells itself."
  },
  tbilisi: {
    kind: "image",
    src: commonsFilePath("File:Tbilisi, Old town, Georgia.jpg"),
    alt: "Old town rooftops in Tbilisi, Georgia.",
    title: "Tbilisi, Old town, Georgia",
    author: "Dmitry A. Mottl",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tbilisi,_Old_town,_Georgia.jpg",
    ...ccBySa40,
    location: "Tbilisi, Georgia",
    punchline: "Rooftop texture, hillside density, and crypto-nomad mystique."
  },
  medellin: {
    kind: "image",
    src: commonsFilePath("File:Medellín skyline02.jpg"),
    alt: "Skyline of Medellin with mountains behind it.",
    title: "Medellín skyline02",
    author: "I.D. R.J.",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Medell%C3%ADn_skyline02.jpg",
    ...ccBySa20,
    location: "Medellin, Colombia",
    punchline: "City heat wrapped in mountains, built for late-night route lust."
  },
  queenstown: {
    kind: "image",
    src: commonsFilePath("File:Queenstown, New Zealand.jpg"),
    alt: "Queenstown seen from above with lake and mountains.",
    title: "Queenstown, New Zealand",
    author: "Charlie Mitchell",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Queenstown,_New_Zealand.jpg",
    ...ccBySa40,
    location: "Queenstown, New Zealand",
    punchline: "Cold lake sheen and full-send alpine MTB energy."
  },
  madeira: {
    kind: "image",
    src: commonsFilePath("File:Cliff in Madeira.jpg"),
    alt: "A dramatic cliffside view in Madeira.",
    title: "Cliff in Madeira",
    author: "Tiia Monto",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Cliff_in_Madeira.jpg",
    ...ccBySa40,
    location: "Madeira, Portugal",
    punchline: "Cliff-road vertigo, ocean drops, and levada-line tension."
  },
  tulum: {
    kind: "image",
    src: commonsFilePath("File:Beach and Ruins at Tulum.jpg"),
    alt: "Ancient Tulum ruins overlooking bright Caribbean water.",
    title: "Beach and Ruins at Tulum",
    author: "FeldBum",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Beach_and_Ruins_at_Tulum.jpg",
    ...ccBySa40,
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
