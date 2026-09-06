import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, PlaneTakeoff } from "lucide-react";

import { HomeGsapEffects } from "@/components/home-gsap-effects";
import { CurrentConditions } from "@/components/current-conditions";
import { MediaCredit } from "@/components/media-credit";
import { ResilientImage } from "@/components/resilient-image";
import { RouteScrollStory } from "@/components/route-scroll-story";
import { getRouteStopMedia, kineticMedia } from "@/lib/media";
import { routePriceLabel } from "@/lib/planner/display";
import { interpretTripIntent } from "@/lib/planner/intent";
import { planTrip } from "@/lib/planner/plan-trip";
import {
  getDestinationMediaFromDatabase,
  saveDestinationMediaToDatabase
} from "@/lib/store/persistent-store";
import { getCurrentConditions } from "@/lib/travel-data/weather";

const planningStack = [
  {
    title: "Set the brief.",
    text: "Add your origin, available days, stop limit, budget, and the kind of trip you want."
  },
  {
    title: "Compare complete routes.",
    text: "Review distance, logistics, estimated cost, and the reason each stop made the cut."
  },
  {
    title: "Save the best fit.",
    text: "Keep a route private while you refine it, or publish a clean link when it is ready to share."
  },
  {
    title: "Continue with providers.",
    text: "Take the finished itinerary to flight and stay providers for confirmed prices and availability."
  }
];

export default async function HomePage() {
  const generation = await planTrip(
    interpretTripIntent({
      prompt: "A 12-day round trip from Singapore with hiking, surf, and one meaningful stop.",
      origin: "Singapore",
      tripLengthDays: 12,
      maxStops: 1,
      wishTags: ["hiking", "surf"],
      budgetMode: "balanced"
    }),
    undefined,
    {
      mediaCache: {
        get: getDestinationMediaFromDatabase,
        set: saveDestinationMediaToDatabase
      }
    }
  );
  const featuredRoutes = generation.routes.slice(0, 4);
  const previewStops = featuredRoutes.slice(0, 3).map((route) =>
    route.stops.find((candidate) => candidate.kind === "destination")
  );
  const previewConditions = await Promise.all(
    previewStops.map((stop) =>
      stop
        ? getCurrentConditions(stop.coordinates.lat, stop.coordinates.lng)
        : Promise.resolve(null)
    )
  );
  const leadRoute = featuredRoutes[0];
  const featuredDestinations = Array.from(
    new Map(
      featuredRoutes
        .flatMap((route) => route.stops)
        .filter((stop) => stop.kind === "destination")
        .map((stop) => [stop.id, stop] as const)
    ).values()
  );
  const leadDestination = featuredDestinations[0];
  const atlasDestinations = featuredDestinations.slice(1, 7);
  const hasLiveDestinationCatalog =
    leadRoute?.dataSource.mode === "live" && leadRoute.dataSource.status === "available";
  const productSignals = [
    {
      label: "Routes generated",
      value: String(featuredRoutes.length),
      detail: "Composed at request time from the same provider pipeline as the planner."
    },
    {
      label: "Destination source",
      value: hasLiveDestinationCatalog ? "LIVE" : "LOCAL",
      detail: leadRoute?.dataFreshness ?? "No destination source returned."
    },
    {
      label: "Planning window",
      value: `${generation.tripIntent.tripLengthDays}d`,
      detail: `Current example brief from ${generation.tripIntent.origin.label}.`
    }
  ];
  const storyMedia = featuredDestinations.slice(0, 3).map(getRouteStopMedia);
  const routeStoryCards = [
    {
      title: "Intent becomes a route brief.",
      text: "Wild Route reads the origin, trip length, stop limit, budget posture, and travel wishes before it scores anything.",
      image: { src: storyMedia[0]?.src ?? kineticMedia.poster ?? kineticMedia.src, alt: storyMedia[0]?.alt ?? "Wild Route journey artwork." }
    },
    {
      title: "Every stop has to earn the detour.",
      text: "The app ranks candidate cities by fit and logistics, then keeps the free-plan recommendation intentionally narrow.",
      image: { src: storyMedia[1]?.src ?? kineticMedia.poster ?? kineticMedia.src, alt: storyMedia[1]?.alt ?? "Wild Route journey artwork." }
    },
    {
      title: "The handoff stays honest.",
      text: "Booking links leave Wild Route for external providers. Prices and availability stay provider-confirmed, not promised here.",
      image: { src: storyMedia[2]?.src ?? kineticMedia.poster ?? kineticMedia.src, alt: storyMedia[2]?.alt ?? "Wild Route journey artwork." }
    }
  ];

  return (
    <main className="journey-index">
      <HomeGsapEffects />
      <section className="atlas-hero">
        <div className="atlas-hero__media" aria-hidden="true">
          <Image
            alt=""
            className="atlas-hero__image"
            src="/editorial/route-ribbon-hero.png"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="atlas-hero__wash" />

        <div className="shell atlas-hero__grid">
          <div className="atlas-hero__copy">
            <p className="eyebrow">Wild Route route planner</p>
            <h1>Plan a route you can explain.</h1>
            <p className="atlas-hero__lede">
              Prompt a round-trip or one-way adventure, compare the tradeoffs,
              and hand the final shape to booking providers.
            </p>
            <div className="atlas-hero__actions">
              <Link className="button button-island" href="/planner">
                <span>Compose a route</span>
                <span className="button-island__icon" aria-hidden="true">
                  <ArrowRight size={17} />
                </span>
              </Link>
              <Link
                className="button button-island button-island--secondary"
                href="/saved"
              >
                <span>Saved routes</span>
                <span className="button-island__icon" aria-hidden="true">
                  <ArrowUpRight size={17} />
                </span>
              </Link>
            </div>
          </div>

          <aside className="route-console" aria-label="Route planning preview">
            <div className="route-console__header">
              <span>Planning estimate</span>
              <small>{generation.tripIntent.origin.label} / {generation.tripIntent.tripLengthDays} days</small>
            </div>
            <p className="route-console__prompt">
              {generation.tripIntent.prompt}
            </p>
            <div className="route-console__tags" aria-label="Trip wishes">
              {generation.tripIntent.wishTags.map((tag) => (
                <span key={tag}>{tag.replaceAll("-", " ")}</span>
              ))}
            </div>
            <div className="route-console__routes">
              {featuredRoutes.slice(0, 3).map((route, routeIndex) => {
                const stop = route.stops.find((candidate) => candidate.kind === "destination");
                return (
                <article key={route.id} className="route-console__route">
                  <span>{stop?.code ?? "—"}</span>
                  <div>
                    <strong>{route.title}</strong>
                    <small>{route.tagline}</small>
                  </div>
                  <b>
                    {stop ? (
                      <CurrentConditions
                        compact
                        initialConditions={previewConditions[routeIndex]}
                        latitude={stop.coordinates.lat}
                        longitude={stop.coordinates.lng}
                      />
                    ) : (
                      routePriceLabel(route)
                    )}
                  </b>
                </article>
                );
              })}
            </div>
          </aside>
        </div>
      </section>

      <section className="shell route-proof">
        <div className="route-proof__intro">
          <h2>Compare routes, not lists.</h2>
          <p>
            See the pace, estimated cost, and reason for each stop before you
            choose what to save.
          </p>
        </div>
        <ol className="route-proof__metrics" aria-label="Route comparison facts">
          {productSignals.map((item) => (
            <li key={item.label}>
              <strong>{item.value}</strong>
              <div>
                <span>{item.label}</span>
                <p>{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="shell planning-stack">
        <div className="planning-stack__heading">
          <h2>From a rough idea to a route.</h2>
        </div>
        <ol className="planning-sequence" aria-label="Product workflow">
          {planningStack.map((item, index) => (
            <li key={item.title}>
              <span className="planning-sequence__index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="shell atlas-section">
        <div className="atlas-section__heading">
          <h2>Places that change the route.</h2>
          <p>
            A strong stop brings more than scenery. It changes the pace,
            opens a different way forward, or makes the journey worth sharing.
          </p>
        </div>

        <div className="atlas-grid">
          {leadDestination ? (
            <article className="atlas-feature">
              <ResilientImage
                alt={getRouteStopMedia(leadDestination).alt}
                className="atlas-feature__image"
                src={getRouteStopMedia(leadDestination).src}
                fill
                sizes="(max-width: 900px) 100vw, 52vw"
              />
              <div className="atlas-feature__shade" />
              <div className="atlas-feature__copy">
                <span>{leadDestination.code}</span>
                <h3>{leadDestination.name}</h3>
                <p>{getRouteStopMedia(leadDestination).punchline}</p>
              </div>
            </article>
          ) : null}

          <div className="atlas-list">
            {atlasDestinations.map((destination) => (
              <article className="atlas-row" key={destination.id}>
                <div className="atlas-row__image-wrap">
                  <ResilientImage
                    alt={getRouteStopMedia(destination).alt}
                    className="atlas-row__image"
                    src={getRouteStopMedia(destination).src}
                    fill
                    sizes="160px"
                  />
                </div>
                <div>
                  <span>{destination.country}</span>
                  <strong>{destination.name}</strong>
                  <p>{destination.scene}</p>
                </div>
                <b>{hasLiveDestinationCatalog ? "Live catalog" : "Local fallback"}</b>
              </article>
            ))}
          </div>
        </div>
      </section>

      <RouteScrollStory cards={routeStoryCards} />

      <section className="kinetic-story">
        <div className="kinetic-story__media" aria-hidden="true">
          {kineticMedia.kind === "video" ? (
            <video
              autoPlay
              className="kinetic-story__image"
              loop
              muted
              playsInline
              poster={kineticMedia.poster}
            >
              <source src={kineticMedia.src} type="video/webm" />
            </video>
          ) : (
            <ResilientImage
              alt=""
              className="kinetic-story__image"
              src={kineticMedia.src}
              fill
              sizes="100vw"
            />
          )}
        </div>
        <div className="kinetic-story__shade" />
        <div className="shell kinetic-story__grid">
          <div>
            <h2>Keep the useful detail. Lose the planning noise.</h2>
          </div>
          <div className="share-artifact">
            <div className="share-artifact__top">
              <span>Published route</span>
              <b>App score {leadRoute ? Math.round(leadRoute.confidence * 100) : 0}%</b>
            </div>
            <h3>{leadRoute?.title ?? "Compose a route to compare real results."}</h3>
            <ol>
              {(leadRoute?.stops ?? []).map((stop) => (
                <li key={`${stop.kind}-${stop.id}`}>{stop.name} · {stop.code}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="shell final-route-cta">
        <div className="final-route-cta__copy">
          <h2>Start with a thought. Leave with a route that makes sense.</h2>
        </div>
        <div className="final-route-cta__actions">
          <div className="final-route-cta__brief" aria-label="Starting route brief">
            <span>{generation.tripIntent.origin.label} origin</span>
            <span>{generation.tripIntent.tripLengthDays} days</span>
            <span>{generation.tripIntent.routeType === "round_trip" ? "Round-trip study" : "One-way study"}</span>
          </div>
          <Link className="button button-island" href="/planner">
            <span>Plan from {generation.tripIntent.origin.label}</span>
            <span className="button-island__icon" aria-hidden="true">
              <PlaneTakeoff size={17} />
            </span>
          </Link>
        </div>
      </section>

      <div className="shell product-media-credit">
        <MediaCredit asset={kineticMedia} compact />
      </div>
    </main>
  );
}
