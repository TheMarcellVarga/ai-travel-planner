import type { DestinationProfile, OriginProfile } from "@/lib/types";

export const defaultOrigin: OriginProfile = {
  label: "Singapore",
  code: "SIN",
  country: "Singapore",
  coordinates: { lat: 1.3521, lng: 103.8198 }
};

export const knownOrigins: OriginProfile[] = [
  defaultOrigin,
  {
    label: "Bangkok",
    code: "BKK",
    country: "Thailand",
    coordinates: { lat: 13.7563, lng: 100.5018 }
  },
  {
    label: "Lisbon",
    code: "LIS",
    country: "Portugal",
    coordinates: { lat: 38.7223, lng: -9.1393 }
  },
  {
    label: "Berlin",
    code: "BER",
    country: "Germany",
    coordinates: { lat: 52.52, lng: 13.405 }
  },
  {
    label: "Sydney",
    code: "SYD",
    country: "Australia",
    coordinates: { lat: -33.8688, lng: 151.2093 }
  }
];

export const destinations: DestinationProfile[] = [
  {
    id: "bali",
    name: "Bali",
    code: "DPS",
    country: "Indonesia",
    region: "Southeast Asia",
    coordinates: { lat: -8.4095, lng: 115.1889 },
    tags: ["crypto-friendly", "animal-friendly", "surf"],
    scene: "Jungle villas, reef breaks, and warm-night scooter energy.",
    imageHint: "Waterfall cliffs and neon-green rice terraces.",
    baseCostUsd: 380,
    comfortCostUsd: 690,
    cryptoFriendly: true,
    activityScore: 8.2
  },
  {
    id: "chiang-mai",
    name: "Chiang Mai",
    code: "CNX",
    country: "Thailand",
    region: "Southeast Asia",
    coordinates: { lat: 18.7883, lng: 98.9853 },
    tags: ["crypto-friendly", "hiking", "mtb"],
    scene: "Mountain loops, creative cafés, and easy digital-nomad logistics.",
    imageHint: "Temple roofs behind smoky mountains.",
    baseCostUsd: 340,
    comfortCostUsd: 620,
    cryptoFriendly: true,
    activityScore: 8.7
  },
  {
    id: "da-nang",
    name: "Da Nang",
    code: "DAD",
    country: "Vietnam",
    region: "Southeast Asia",
    coordinates: { lat: 16.0544, lng: 108.2022 },
    tags: ["surf", "hiking"],
    scene: "Sea-to-mountain transitions with cheap food and fast exits.",
    imageHint: "Coastal roads and foggy peaks.",
    baseCostUsd: 360,
    comfortCostUsd: 650,
    cryptoFriendly: false,
    activityScore: 7.9
  },
  {
    id: "cape-town",
    name: "Cape Town",
    code: "CPT",
    country: "South Africa",
    region: "Africa",
    coordinates: { lat: -33.9249, lng: 18.4241 },
    tags: ["hiking", "mtb", "animal-friendly"],
    scene: "Big-mountain drama, coastal light, and high-photo-payoff trails.",
    imageHint: "Table Mountain with ocean haze.",
    baseCostUsd: 740,
    comfortCostUsd: 1180,
    cryptoFriendly: false,
    activityScore: 9.4
  },
  {
    id: "tbilisi",
    name: "Tbilisi",
    code: "TBS",
    country: "Georgia",
    region: "Caucasus",
    coordinates: { lat: 41.7151, lng: 44.8271 },
    tags: ["crypto-friendly", "hiking"],
    scene: "Hilltop old town, nomad-friendly stays, and gateway access to mountain terrain.",
    imageHint: "Warm stone streets and cable-car skyline.",
    baseCostUsd: 520,
    comfortCostUsd: 840,
    cryptoFriendly: true,
    activityScore: 8.1
  },
  {
    id: "medellin",
    name: "Medellin",
    code: "MDE",
    country: "Colombia",
    region: "South America",
    coordinates: { lat: 6.2442, lng: -75.5812 },
    tags: ["crypto-friendly", "mtb"],
    scene: "Dense city energy, mountain weather, and a strong remote-worker scene.",
    imageHint: "Cable cars over green valleys.",
    baseCostUsd: 690,
    comfortCostUsd: 1020,
    cryptoFriendly: true,
    activityScore: 7.8
  },
  {
    id: "queenstown",
    name: "Queenstown",
    code: "ZQN",
    country: "New Zealand",
    region: "Oceania",
    coordinates: { lat: -45.0312, lng: 168.6626 },
    tags: ["hiking", "mtb", "animal-friendly"],
    scene: "Alpine drama, all-day rides, and route cards that feel like game posters.",
    imageHint: "Cold lakes and knife-edge trails.",
    baseCostUsd: 920,
    comfortCostUsd: 1460,
    cryptoFriendly: false,
    activityScore: 9.7
  },
  {
    id: "madeira",
    name: "Madeira",
    code: "FNC",
    country: "Portugal",
    region: "Atlantic",
    coordinates: { lat: 32.7607, lng: -16.9595 },
    tags: ["hiking", "surf"],
    scene: "Volcanic cliffs, levada trails, and a strong creator-travel aesthetic.",
    imageHint: "Sharp green ridges above the sea.",
    baseCostUsd: 610,
    comfortCostUsd: 920,
    cryptoFriendly: false,
    activityScore: 8.8
  },
  {
    id: "tulum",
    name: "Tulum",
    code: "TQO",
    country: "Mexico",
    region: "North America",
    coordinates: { lat: 20.2114, lng: -87.4654 },
    tags: ["crypto-friendly", "animal-friendly", "surf"],
    scene: "Caribbean coast with remote-work amenities and a strong visual identity.",
    imageHint: "Sea-worn ruins and turquoise water.",
    baseCostUsd: 640,
    comfortCostUsd: 990,
    cryptoFriendly: true,
    activityScore: 7.5
  }
];

