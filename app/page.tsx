import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, PlaneTakeoff } from "lucide-react";

import { HomeGsapEffects } from "@/components/home-gsap-effects";
import { MediaCredit } from "@/components/media-credit";
import { ResilientImage } from "@/components/resilient-image";
import { RouteScrollStory } from "@/components/route-scroll-story";
import { destinations } from "@/lib/data/destinations";
import {
  destinationMedia,
  expeditionIndex,
  kineticMedia
} from "@/lib/media";
import { wishTags } from "@/lib/site";

const productSignals = [
  { label: "Ranked route studies", value: "4", detail: "Compared by pace, budget posture, and stop quality." },
  { label: "Promoted stop", value: "1", detail: "Free routes keep one recommendation in focus." },
  { label: "Planning window", value: "12d", detail: "Built for open-jaw travel, not packaged tours." }
];

const planningStack = [
  {
    title: "Begin with the feeling.",
    text: "Describe the pace, climate, and detours you have in mind. The planner turns that into a useful brief."
  },
  {
    title: "Compare the shape.",
    text: "Routes are weighed by distance, logistics, price, and whether each stop earns its place."
  },
  {
    title: "Keep the right one.",
    text: "Save a route privately, or publish a clean link when it is ready to leave your notes."
  },
  {
    title: "Book with context.",
    text: "Wild Route hands the itinerary to flight and stay providers once the decisions are made."
  }
];

const plannerPreviewRoutes = [
  {
    code: "SIN",
    title: "Singapore to Bali",
    meta: "surf, jungle, scooter radius",
    price: "$380 est."
  },
  {
    code: "CNX",
    title: "Chiang Mai climb loop",
    meta: "mtb, cafes, mountain air",
    price: "$340 est."
  },
  {
    code: "FNC",
    title: "Madeira cliff run",
    meta: "levadas, Atlantic light",
    price: "$610 est."
  }
];

const featuredDestinations = expeditionIndex
  .slice(0, 7)
  .map((destinationId) => {
    const destination = destinations.find((item) => item.id === destinationId);
    return destination ? { destination, media: destinationMedia[destinationId] } : null;
  })
  .filter((item): item is NonNullable<typeof item> => Boolean(item));

const leadDestination = featuredDestinations[0];
const atlasDestinations = featuredDestinations.slice(1);

const routeStoryCards = [
  {
    title: "Intent becomes a route brief.",
    text: "Wild Route reads the origin, trip length, stop limit, budget posture, and travel wishes before it scores anything.",
    image: {
      src: destinationMedia.bali.src,
      alt: destinationMedia.bali.alt
    }
  },
  {
    title: "Every stop has to earn the detour.",
    text: "The app ranks candidate cities by fit and logistics, then keeps the free-plan recommendation intentionally narrow.",
    image: {
      src: destinationMedia["chiang-mai"].src,
      alt: destinationMedia["chiang-mai"].alt
    }
  },
  {
    title: "The handoff stays honest.",
    text: "Booking links leave Wild Route for external providers. Prices and availability stay provider-confirmed, not promised here.",
    image: {
      src: destinationMedia.madeira.src,
      alt: destinationMedia.madeira.alt
    }
  }
];

export default function HomePage() {
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
              <Link className="text-link" href="/saved">
                Saved routes
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>

          <aside className="route-console" aria-label="Route planning preview">
            <div className="route-console__header">
              <span>Planning estimate</span>
              <small>Singapore / 12 days</small>
            </div>
            <p className="route-console__prompt">
              A warm-weather departure with room to work, a little surf, and
              one stop that changes the rhythm of the trip.
            </p>
            <div className="route-console__tags" aria-label="Trip wishes">
              {wishTags.map((tag) => (
                <span key={tag}>{tag.replaceAll("-", " ")}</span>
              ))}
            </div>
            <div className="route-console__routes">
              {plannerPreviewRoutes.map((route) => (
                <article key={route.title} className="route-console__route">
                  <span>{route.code}</span>
                  <div>
                    <strong>{route.title}</strong>
                    <small>{route.meta}</small>
                  </div>
                  <b>{route.price}</b>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="shell route-proof">
        <div className="route-proof__intro">
          <h2>A route is more than a city list.</h2>
          <p>
            Wild Route gives each journey a point of view: a pace, a price
            posture, a reason for every stop, and a shareable form when the
            pieces feel settled.
          </p>
        </div>
        <div className="route-proof__metrics">
          {productSignals.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell planning-stack">
        <div className="planning-stack__heading">
          <h2>Make fewer choices, with better reasons.</h2>
        </div>
        <div
          className="planning-bento"
          aria-label="Product workflow"
          role="region"
        >
          <article className="planning-bento__cell planning-bento__cell--wide">
            <h3>{planningStack[0].title}</h3>
            <p>{planningStack[0].text}</p>
            <div className="prompt-strip">
              <span>origin: SIN</span>
              <span>days: 12</span>
              <span>max stops: 1</span>
              <span>budget: balanced</span>
            </div>
          </article>

          {planningStack.slice(1).map((item, index) => (
            <article className="planning-bento__cell" key={item.title}>
              <span className="planning-bento__index">{index + 2}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
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
                alt={leadDestination.media.alt}
                className="atlas-feature__image"
                src={leadDestination.media.src}
                fill
                sizes="(max-width: 900px) 100vw, 52vw"
              />
              <div className="atlas-feature__shade" />
              <div className="atlas-feature__copy">
                <span>{leadDestination.destination.code}</span>
                <h3>{leadDestination.destination.name}</h3>
                <p>{leadDestination.media.punchline}</p>
              </div>
            </article>
          ) : null}

          <div className="atlas-list">
            {atlasDestinations.map(({ destination, media }) => (
              <article className="atlas-row" key={destination.id}>
                <div className="atlas-row__image-wrap">
                  <ResilientImage
                    alt={media.alt}
                    className="atlas-row__image"
                    src={media.src}
                    fill
                    sizes="160px"
                  />
                </div>
                <div>
                  <span>{destination.region}</span>
                  <strong>{destination.name}</strong>
                  <p>{destination.scene}</p>
                </div>
                <b>${destination.baseCostUsd} est.</b>
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
              <b>App score 82%</b>
            </div>
            <h3>A warm base, a surf exit, one meaningful detour.</h3>
            <ol>
              <li>Depart Singapore</li>
              <li>Pause in Bali</li>
              <li>Continue when ready</li>
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
            <span>Singapore origin</span>
            <span>12 days</span>
            <span>Round-trip study</span>
          </div>
          <Link className="button button-island" href="/planner">
            <span>Plan from Singapore</span>
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
