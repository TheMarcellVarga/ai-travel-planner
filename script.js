const wishOptions = [
  "Crypto Friendly",
  "Animal Friendly",
  "Hiking",
  "MTB",
  "Surf Access",
  "Waterfall Focus",
];

const destinations = [
  {
    id: "singapore",
    name: "Singapore",
    short: "SIN",
    lat: 1.3521,
    lon: 103.8198,
    tags: ["Crypto Friendly"],
    promoted: false,
  },
  {
    id: "bali",
    name: "Bali",
    short: "DPS",
    lat: -8.4095,
    lon: 115.1889,
    tags: ["Crypto Friendly", "Surf Access", "Animal Friendly"],
    promoted: true,
  },
  {
    id: "chiang-mai",
    name: "Chiang Mai",
    short: "CNX",
    lat: 18.7883,
    lon: 98.9853,
    tags: ["Crypto Friendly", "Hiking", "MTB"],
    promoted: false,
  },
  {
    id: "da-nang",
    name: "Da Nang",
    short: "DAD",
    lat: 16.0544,
    lon: 108.2022,
    tags: ["Surf Access", "Hiking"],
    promoted: false,
  },
  {
    id: "cape-town",
    name: "Cape Town",
    short: "CPT",
    lat: -33.9249,
    lon: 18.4241,
    tags: ["Hiking", "MTB", "Animal Friendly"],
    promoted: false,
  },
  {
    id: "tbilisi",
    name: "Tbilisi",
    short: "TBS",
    lat: 41.7151,
    lon: 44.8271,
    tags: ["Crypto Friendly", "Hiking"],
    promoted: false,
  },
  {
    id: "medellin",
    name: "Medellin",
    short: "MDE",
    lat: 6.2442,
    lon: -75.5812,
    tags: ["Crypto Friendly", "MTB"],
    promoted: false,
  },
  {
    id: "queenstown",
    name: "Queenstown",
    short: "ZQN",
    lat: -45.0312,
    lon: 168.6626,
    tags: ["Hiking", "MTB", "Animal Friendly"],
    promoted: false,
  },
];

const routes = [
  {
    id: "route-01",
    title: "Jungle Signal",
    tagline: "Singapore -> Bali -> Chiang Mai",
    stops: ["singapore", "bali", "chiang-mai"],
    price: "$418",
    days: "12 days",
    rule: "1 promoted stop on free plan",
    tags: ["Crypto Friendly", "Hiking"],
  },
  {
    id: "route-02",
    title: "Cliff Drop",
    tagline: "Singapore -> Da Nang -> Bali",
    stops: ["singapore", "da-nang", "bali"],
    price: "$386",
    days: "9 days",
    rule: "1 stop, surf and jungle mix",
    tags: ["Surf Access", "Hiking"],
  },
  {
    id: "route-03",
    title: "Remote Loot",
    tagline: "Singapore -> Tbilisi -> Cape Town",
    stops: ["singapore", "tbilisi", "cape-town"],
    price: "$772",
    days: "18 days",
    rule: "Long-haul adventure route",
    tags: ["Crypto Friendly", "Hiking", "Animal Friendly"],
  },
];

const moodCards = [
  {
    title: "Canopy Heat",
    text: "Pinned rainforest stays, waterfall day loops, and camera-roll-first visuals.",
    image:
      "linear-gradient(135deg, rgba(54,126,68,0.72), rgba(7,18,12,0.26)), radial-gradient(circle at top, rgba(255,227,135,0.34), transparent 30%), linear-gradient(135deg, #4c8d4d, #10251a)",
  },
  {
    title: "Trail Currency",
    text: "Crypto-accepted hubs mixed with rides, hikes, and low-friction one-way jumps.",
    image:
      "linear-gradient(135deg, rgba(9,64,48,0.24), rgba(7,18,12,0.18)), radial-gradient(circle at 75% 18%, rgba(156,255,102,0.38), transparent 22%), linear-gradient(135deg, #1f6a52, #091712)",
  },
  {
    title: "Ruins After Dark",
    text: "Slightly dangerous, cinematic, saturated, and designed to feel collectible.",
    image:
      "linear-gradient(135deg, rgba(61,124,83,0.16), rgba(6,14,10,0.24)), radial-gradient(circle at 35% 20%, rgba(255,138,91,0.32), transparent 26%), linear-gradient(135deg, #6d5732, #112019)",
  },
  {
    title: "Globe Feed",
    text: "Pin clusters become tappable story cards, ideal for social sharing and route flexing.",
    image:
      "linear-gradient(135deg, rgba(15,92,53,0.22), rgba(7,18,12,0.18)), radial-gradient(circle at 15% 20%, rgba(255,255,255,0.24), transparent 20%), linear-gradient(135deg, #2b714e, #0b1811)",
  },
];

const globe = document.querySelector("#globe");
const globeShell = document.querySelector(".globe-shell");
const routeLayer = document.querySelector(".route-layer");
const routeList = document.querySelector("#route-list");
const focusCard = document.querySelector("#focus-card");
const playbackStatus = document.querySelector("#playback-status");
const moodGrid = document.querySelector("#mood-grid");
const wishChips = document.querySelector("#wishlist-chips");
const generateButton = document.querySelector("#generate-button");

const state = {
  rotation: 0,
  activeRouteId: routes[0].id,
  activeStopIndex: 0,
  selectedTags: new Set(["Crypto Friendly", "Hiking", "MTB", "Animal Friendly"]),
};

const pinNodes = new Map();
let playbackTimer = null;

function buildWishChips() {
  wishOptions.forEach((label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = label;
    button.setAttribute("role", "listitem");

    if (state.selectedTags.has(label)) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      if (state.selectedTags.has(label)) {
        state.selectedTags.delete(label);
        button.classList.remove("active");
      } else {
        state.selectedTags.add(label);
        button.classList.add("active");
      }

      renderRoutes();
      renderRoutePath();
      updateFocusCard();
    });

    wishChips.append(button);
  });
}

function createPins() {
  destinations.forEach((destination) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `pin ${destination.promoted ? "promoted" : "standard"}`;
    button.dataset.label = destination.name;
    button.textContent = destination.short;

    button.addEventListener("click", () => {
      const matchingRoute = routes.find((route) => route.stops.includes(destination.id));
      if (matchingRoute) {
        selectRoute(matchingRoute.id, matchingRoute.stops.indexOf(destination.id));
      }
    });

    globe.append(button);
    pinNodes.set(destination.id, button);
  });
}

function projectPoint(lat, lon, rotation) {
  const radius = globe.clientWidth / 2;
  const latRad = (lat * Math.PI) / 180;
  const lonRad = ((lon + rotation) * Math.PI) / 180;

  const x = Math.cos(latRad) * Math.sin(lonRad);
  const y = Math.sin(latRad);
  const z = Math.cos(latRad) * Math.cos(lonRad);

  return {
    x: radius + x * radius * 0.86,
    y: radius - y * radius * 0.86,
    depth: z,
    visible: z > -0.18,
  };
}

function updatePins() {
  const activeRoute =
    getVisibleRoutes().find((route) => route.id === state.activeRouteId) ?? getVisibleRoutes()[0];
  const activeStopId = activeRoute?.stops[state.activeStopIndex];

  destinations.forEach((destination) => {
    const pin = pinNodes.get(destination.id);
    const point = projectPoint(destination.lat, destination.lon, state.rotation);
    const scale = 0.62 + Math.max(point.depth, 0) * 0.48;

    pin.style.left = `${point.x}px`;
    pin.style.top = `${point.y}px`;
    pin.style.opacity = point.visible ? `${0.35 + scale * 0.85}` : "0";
    pin.style.transform = `translate(-50%, -50%) scale(${scale})`;
    pin.style.zIndex = `${Math.round((point.depth + 1) * 100)}`;
    pin.classList.toggle("active", destination.id === activeStopId);
  });
}

function getVisibleRoutes() {
  const hasFilters = state.selectedTags.size > 0;
  const filtered = routes.filter((route) => {
    if (!hasFilters) {
      return true;
    }

    return route.tags.some((tag) => state.selectedTags.has(tag));
  });

  return filtered.length ? filtered : routes;
}

function renderRoutes() {
  const visibleRoutes = getVisibleRoutes();
  if (!visibleRoutes.some((route) => route.id === state.activeRouteId)) {
    state.activeRouteId = visibleRoutes[0].id;
    state.activeStopIndex = 0;
  }

  routeList.innerHTML = "";

  visibleRoutes.forEach((route) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "route-card";

    if (route.id === state.activeRouteId) {
      card.classList.add("active");
    }

    card.innerHTML = `
      <div class="route-card-top">
        <div>
          <p class="eyebrow">Suggested hunt</p>
          <h4>${route.title}</h4>
        </div>
        <span class="route-price">${route.price}</span>
      </div>
      <p class="route-meta">${route.tagline}</p>
      <div class="route-card-bottom">
        <span class="route-rule">${route.rule}</span>
        <span class="route-rule">${route.days}</span>
      </div>
    `;

    card.addEventListener("click", () => selectRoute(route.id, 0));
    routeList.append(card);
  });
}

function renderMoodCards() {
  moodGrid.innerHTML = "";

  moodCards.forEach((card) => {
    const article = document.createElement("article");
    article.className = "mood-card";
    article.style.setProperty("--card-image", card.image);
    article.innerHTML = `
      <div class="mood-card-text">
        <p class="eyebrow">Inspiration pin</p>
        <h4>${card.title}</h4>
        <p>${card.text}</p>
      </div>
    `;
    moodGrid.append(article);
  });
}

function renderRoutePath() {
  const route = getVisibleRoutes().find((item) => item.id === state.activeRouteId) ?? routes[0];
  const shellRect = globeShell.getBoundingClientRect();
  const globeRect = globe.getBoundingClientRect();
  const points = route.stops
    .map((stopId) => destinations.find((destination) => destination.id === stopId))
    .map((destination) => {
      const point = projectPoint(destination.lat, destination.lon, state.rotation);
      return {
        ...point,
        shellX: globeRect.left - shellRect.left + point.x,
        shellY: globeRect.top - shellRect.top + point.y,
      };
    })
    .filter((point) => point.visible);

  if (points.length < 2) {
    routeLayer.innerHTML = "";
    return;
  }

  routeLayer.setAttribute("viewBox", `0 0 ${shellRect.width} ${shellRect.height}`);

  const commands = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.shellX} ${point.shellY}`)
    .join(" ");

  const nodes = points
    .map(
      (point) => `<circle class="route-node" cx="${point.shellX}" cy="${point.shellY}" r="4"></circle>`
    )
    .join("");

  routeLayer.innerHTML = `<path class="route-path" d="${commands}"></path>${nodes}`;
}

function updateFocusCard() {
  const route = getVisibleRoutes().find((item) => item.id === state.activeRouteId) ?? routes[0];
  const stopId = route.stops[state.activeStopIndex];
  const stop = destinations.find((destination) => destination.id === stopId);
  const activeTags = stop.tags.join(" | ");

  focusCard.innerHTML = `
    <p class="eyebrow">Active hop</p>
    <h4>${stop.name}</h4>
    <p>${route.title} is currently highlighting ${stop.name}. Signals: ${activeTags}.</p>
  `;
}

function selectRoute(routeId, stopIndex = 0) {
  state.activeRouteId = routeId;
  state.activeStopIndex = stopIndex;
  playbackStatus.textContent = "Previewing route playback";
  renderRoutes();
  renderRoutePath();
  updateFocusCard();
  restartPlayback();
}

function restartPlayback() {
  window.clearInterval(playbackTimer);
  playbackTimer = window.setInterval(() => {
    const route = getVisibleRoutes().find((item) => item.id === state.activeRouteId) ?? routes[0];
    state.activeStopIndex = (state.activeStopIndex + 1) % route.stops.length;
    updateFocusCard();
  }, 1800);
}

function animate() {
  state.rotation += 0.18;
  updatePins();
  renderRoutePath();
  requestAnimationFrame(animate);
}

function attachActions() {
  generateButton.addEventListener("click", () => {
    const prompt = document.querySelector("#trip-prompt").value.trim();
    playbackStatus.textContent = "Refreshing routes for selected wishes";
    const visibleRoutes = getVisibleRoutes();
    state.activeRouteId = visibleRoutes[0].id;
    state.activeStopIndex = 0;
    renderRoutes();
    renderRoutePath();
    updateFocusCard();
    restartPlayback();

    if (prompt) {
      focusCard.innerHTML = `
        <p class="eyebrow">Prompt lock</p>
        <h4>Route hunt refreshed</h4>
        <p>${prompt}</p>
      `;
      window.setTimeout(updateFocusCard, 1600);
    }
  });
}

buildWishChips();
createPins();
renderRoutes();
renderMoodCards();
updateFocusCard();
renderRoutePath();
restartPlayback();
attachActions();

window.addEventListener("resize", () => {
  updatePins();
  renderRoutePath();
});

requestAnimationFrame(animate);
