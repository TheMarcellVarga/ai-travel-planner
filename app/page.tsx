import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, PlaneTakeoff } from "lucide-react";

import { MediaCredit } from "@/components/media-credit";
import { destinations } from "@/lib/data/destinations";
import {
  destinationMedia,
  expeditionIndex,
  heroMedia,
  kineticMedia
} from "@/lib/media";
import { wishTags } from "@/lib/site";

const productSignals = [
  { label: "Route candidates", value: "4", detail: "ranked against mood, budget, and stop rules" },
  { label: "Promoted stop", value: "1", detail: "free-tier rule is visible instead of hidden" },
  { label: "Search window", value: "12d", detail: "built for one-way exploration, not package tours" }
];

const planningStack = [
  {
    title: "Prompt parsing",
    text: "The planner turns messy intent into origin, days, stops, budget posture, and travel wishes."
  },
  {
    title: "Route scoring",
    text: "Destinations are ranked for terrain, logistics, price bands, and how strong the story looks."
  },
  {
    title: "Save and publish",
    text: "Signed-in travelers keep routes, publish one clean share page, and hand off when ready."
  },
  {
    title: "Provider exit",
    text: "Wild Route stops at decision quality, then sends travelers out to flight and lodging providers."
  }
];

const plannerPreviewRoutes = [
  {
    code: "SIN",
    title: "Singapore to Bali",
    meta: "surf, jungle, scooter radius",
    price: "$380"
  },
  {
    code: "CNX",
    title: "Chiang Mai climb loop",
    meta: "mtb, cafes, mountain air",
    price: "$340"
  },
  {
    code: "FNC",
    title: "Madeira cliff run",
    meta: "levadas, Atlantic light",
    price: "$610"
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

export default function HomePage() {
  return (
    <main className="journey-index">
      <section className="atlas-hero">
        <div className="atlas-hero__media" aria-hidden="true">
          {heroMedia.kind === "video" ? (
            <video
              autoPlay
              className="atlas-hero__image"
              loop
              muted
              playsInline
              poster={heroMedia.poster}
            >
              <source src={heroMedia.src} type="video/webm" />
            </video>
          ) : (
            <Image
              alt=""
              className="atlas-hero__image"
              src={heroMedia.src}
              fill
              priority
              sizes="100vw"
            />
          )}
        </div>
        <div className="atlas-hero__wash" />

        <div className="shell atlas-hero__grid">
          <div className="atlas-hero__copy">
            <p className="eyebrow">Wild Route adventure planner</p>
            <h1>Routes for terrain-first travelers.</h1>
            <p className="atlas-hero__lede">
              Type the kind of trip you want. Wild Route turns it into ranked
              one-way adventure routes with stop logic, cost bands, saved cards,
              public share pages, and clean booking handoff.
            </p>
            <div className="atlas-hero__actions">
              <Link className="button button-island" href="/planner">
                <span>Build a route</span>
                <span className="button-island__icon" aria-hidden="true">
                  <ArrowRight size={17} />
                </span>
              </Link>
              <Link className="text-link" href="/saved">
                Open saved vault
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>

          <aside className="route-console" aria-label="Route planning preview">
            <div className="route-console__header">
              <span>Prompt console</span>
              <small>live intent model</small>
            </div>
            <p className="route-console__prompt">
              12 days from Singapore. One stop max. Jungle, surf, a cheap
              work base, and one place worth publishing.
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
          <p className="eyebrow">From impulse to handoff</p>
          <h2>Not a city list. A decision surface.</h2>
          <p>
            The MVP is a real product shell: anonymous exploration, account
            vaults, public route pages, and a booking handoff model designed for
            deeper provider data later.
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
          <p className="eyebrow">Planner architecture</p>
          <h2>Every screen should answer a traveler’s next question.</h2>
        </div>
        <div className="planning-bento" aria-label="Product workflow">
          <article className="planning-bento__cell planning-bento__cell--wide">
            <span className="planning-bento__index">01</span>
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
              <span className="planning-bento__index">
                0{index + 2}
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell atlas-section">
        <div className="atlas-section__heading">
          <p className="eyebrow">Destination atlas</p>
          <h2>Places with a point of view.</h2>
          <p>
            Each market needs scenery, logistics, and a reason to move. The
            route card should already feel like a shareable artifact.
          </p>
        </div>

        <div className="atlas-grid">
          {leadDestination ? (
            <article className="atlas-feature">
              <Image
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
                  <Image
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
                <b>${destination.baseCostUsd}</b>
              </article>
            ))}
          </div>
        </div>
      </section>

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
            <Image
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
            <p className="eyebrow">Shareable output</p>
            <h2>A route card should feel like something worth sending.</h2>
          </div>
          <div className="share-artifact">
            <div className="share-artifact__top">
              <span>published route</span>
              <b>confidence 82%</b>
            </div>
            <h3>Jungle base, surf exit, one promoted stop.</h3>
            <ol>
              <li>Singapore origin</li>
              <li>Bali promoted stop</li>
              <li>Provider handoff ready</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="shell final-route-cta">
        <div>
          <p className="eyebrow">Open the planner</p>
          <h2>Start with a wish. Leave with a route you can defend.</h2>
        </div>
        <Link className="button button-island" href="/planner">
          <span>Plan from Singapore</span>
          <span className="button-island__icon" aria-hidden="true">
            <PlaneTakeoff size={17} />
          </span>
        </Link>
      </section>

      <div className="shell product-media-credit">
        <MediaCredit asset={heroMedia} compact />
        <MediaCredit asset={kineticMedia} compact />
      </div>
    </main>
  );
}
