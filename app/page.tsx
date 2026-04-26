import Link from "next/link";
import {
  ArrowRight,
  Binoculars,
  Compass,
  Globe2,
  Map,
  Mountain,
  Radio,
  Route,
  ShieldCheck,
  Sparkles,
  Ticket
} from "lucide-react";

import { MediaCredit } from "@/components/media-credit";
import { destinations } from "@/lib/data/destinations";
import {
  destinationMedia,
  expeditionIndex,
  heroMedia,
  kineticMedia
} from "@/lib/media";
import { wishTags } from "@/lib/site";

const highlights = [
  {
    title: "Prompt-first planning",
    text: "Describe the mood, stop rules, budget, and trip wishes instead of filling stale airline forms.",
    icon: Sparkles
  },
  {
    title: "Cinematic route playback",
    text: "Turn a ranked itinerary into a visual route hunt with real stops, handoff links, and shareable cards.",
    icon: Globe2
  },
  {
    title: "Adventure scoring",
    text: "Prioritize hiking, MTB, surf, crypto-friendly cities, animal-friendly stays, and high-photo-payoff terrain.",
    icon: Compass
  },
  {
    title: "Booking handoff",
    text: "Use Wild Route to pick the route, then leave cleanly for flight, lodging, and ground transport providers.",
    icon: Ticket
  }
];

const productModules = [
  {
    title: "Route Index",
    text: "A searchable catalog of destination cards, route moods, trip tags, and expected budget bands.",
    icon: Map
  },
  {
    title: "Expedition Briefs",
    text: "Each route ships with why-go context, terrain cues, stay logic, and the travel compromises upfront.",
    icon: Binoculars
  },
  {
    title: "Live Deal Watch",
    text: "Saved routes can become alerts so travelers know when the price window turns worth acting on.",
    icon: Radio
  },
  {
    title: "Provider Handoff",
    text: "The product does not pretend to be an airline. It gets users from desire to decisive booking links.",
    icon: Route
  }
];

const customerProfiles = [
  {
    title: "Remote workers",
    text: "Find places with strong logistics, cheaper comfort, and enough terrain to make a month feel earned."
  },
  {
    title: "Adventure couples",
    text: "Compare dramatic routes without turning the planning session into twenty tabs and a spreadsheet."
  },
  {
    title: "Creator-led trips",
    text: "Pick destinations that already have a visual point of view, then share the route as a polished card."
  }
];

const routeStyles = [
  "Temple stairs after rain",
  "Ocean cliffs before sunset",
  "Mountain bike transfer days",
  "Volcanic coast road trips",
  "Ruins, reefs, and cheap flights",
  "Digital nomad base camps"
];

const featuredDestinations = expeditionIndex
  .slice(0, 6)
  .map((destinationId) => {
    const destination = destinations.find((item) => item.id === destinationId);
    return destination ? { destination, media: destinationMedia[destinationId] } : null;
  })
  .filter((item): item is NonNullable<typeof item> => Boolean(item));

export default function HomePage() {
  return (
    <main className="product-index cinematic-index">
      <section className="product-hero product-hero--cinematic">
        <div className="product-hero__media" aria-hidden="true">
          {heroMedia.kind === "video" ? (
            <video
              autoPlay
              className="hero-media product-hero__image"
              loop
              muted
              playsInline
              poster={heroMedia.poster}
            >
              <source src={heroMedia.src} type="video/webm" />
            </video>
          ) : (
            <img
              alt=""
              className="hero-media product-hero__image"
              src={heroMedia.src}
            />
          )}
        </div>
        <div className="product-hero__overlay" />

        <div className="product-hero__content shell">
          <div className="product-hero__copy">
            <p className="eyebrow">Wild Route adventure index</p>
            <h1>Plan routes that feel found, not filed.</h1>
            <p className="lede">
              Wild Route is a product index for cinematic travel decisions:
              jungle-first destination discovery, route scoring, saved deal
              watch, and clean booking handoff for people who plan around
              terrain, motion, and story.
            </p>
            <div className="button-row">
              <Link href="/planner" className="button">
                Open Planner
                <ArrowRight size={18} />
              </Link>
              <Link href="/saved" className="button button-ghost">
                View Saved Routes
              </Link>
            </div>
          </div>

          <div className="product-hero__rail">
            <div className="artifact-panel">
              <p className="eyebrow">Index status</p>
              <strong>9 field-tested adventure markets</strong>
              <span>
                Ranked for cost, movement, route drama, nomad logistics, and
                booking readiness.
              </span>
            </div>
            <div className="product-stat-grid product-stat-grid--hero">
              <div className="product-stat-card">
                <strong>9</strong>
                <span>Destinations</span>
              </div>
              <div className="product-stat-card">
                <strong>5</strong>
                <span>Wish filters</span>
              </div>
              <div className="product-stat-card">
                <strong>3</strong>
                <span>Route budgets</span>
              </div>
              <div className="product-stat-card">
                <strong>1</strong>
                <span>Clean handoff</span>
              </div>
            </div>
          </div>

          <div className="scroll-cue" aria-hidden="true">
            <span />
            <small>Scroll the index</small>
          </div>
        </div>
      </section>

      <section className="shell product-section product-section--split product-section--cinematic">
        <div className="product-stack">
          <div className="section-heading">
            <p className="eyebrow">Business surface</p>
            <h2>What the product actually sells</h2>
          </div>
          <div className="product-module-grid">
            {productModules.map((item) => {
              const Icon = item.icon;
              return (
                <article className="product-module-card" key={item.title}>
                  <div className="product-module-card__icon">
                    <Icon strokeWidth={1.6} />
                  </div>
                  <div className="product-module-card__copy">
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="product-side-panel relic-panel">
          <p className="eyebrow">Adventure filters</p>
          <h3>Built around how people choose a trip.</h3>
          <p className="muted-copy">
            The index is not a generic city list. It gives each destination a
            reason to exist in the catalog, then lets the planner rank it
            against what the traveler actually cares about.
          </p>
          <div className="tag-row" aria-label="Trip wishes">
            {wishTags.map((tag) => (
              <span className="tag-pill" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </aside>
      </section>

      <section className="shell product-section destination-index-section">
        <div className="section-heading section-heading--wide">
          <p className="eyebrow">Destination index</p>
          <h2>Markets with scenery, logistics, and a reason to move.</h2>
        </div>

        <div className="product-destination-grid">
          {featuredDestinations.map(({ destination, media }) => (
            <article className="product-destination-card" key={destination.id}>
              <div className="product-destination-card__media">
                <img
                  alt={media.alt}
                  className="product-destination-card__image"
                  src={media.src}
                />
                <div className="product-destination-card__overlay" />
                <div className="product-destination-card__headline">
                  <p className="eyebrow">{destination.code}</p>
                  <h3>{destination.name}</h3>
                  <span>{destination.region}</span>
                </div>
              </div>
              <div className="product-destination-card__body">
                <p>{destination.scene}</p>
                <div className="product-destination-card__meta">
                  <span>From ${destination.baseCostUsd}</span>
                  <span>Comfort ${destination.comfortCostUsd}</span>
                  <span>{destination.activityScore.toFixed(1)} activity</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cinematic-band">
        <div className="cinematic-band__media" aria-hidden="true">
          {kineticMedia.kind === "video" ? (
            <video
              autoPlay
              className="kinetic-video"
              loop
              muted
              playsInline
              poster={kineticMedia.poster}
            >
              <source src={kineticMedia.src} type="video/webm" />
            </video>
          ) : (
            <img alt="" className="kinetic-video" src={kineticMedia.src} />
          )}
          <div className="kinetic-video-overlay" />
        </div>
        <div className="shell cinematic-band__content">
          <p className="eyebrow">Cinematic scroll layer</p>
          <h2>The route should reveal itself like a field journal.</h2>
          <p>
            Scroll from the hero into operational product surfaces: markets,
            filters, customer use cases, and the exact workflow from prompt to
            booking handoff.
          </p>
          <div className="route-style-grid">
            {routeStyles.map((style) => (
              <span key={style}>{style}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="shell product-section product-section--split">
        <div className="product-stack">
          <div className="section-heading">
            <p className="eyebrow">Route workflow</p>
            <h2>From impulse to itinerary without losing the mood.</h2>
          </div>
          <div className="feature-list feature-list--product">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <article className="feature-list-item" key={item.title}>
                  <div className="feature-list-icon">
                    <Icon strokeWidth={1.5} />
                  </div>
                  <div className="feature-list-content">
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="product-profile-list">
          {customerProfiles.map((profile) => (
            <article className="product-profile-card" key={profile.title}>
              <strong>{profile.title}</strong>
              <p>{profile.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell product-cta product-cta--final">
        <div className="product-cta__copy">
          <p className="eyebrow">Ready for the first route</p>
          <h2>Start with a mood, leave with a route worth booking.</h2>
          <p className="muted-copy">
            Wild Route keeps the adventure front and center while the product
            does the practical work: ranking destinations, shaping route logic,
            saving options, and handing off to providers.
          </p>
        </div>
        <div className="product-cta__actions">
          <Link href="/planner" className="button">
            Launch Planner
            <Mountain size={18} />
          </Link>
          <Link href="/saved" className="product-inline-link">
            Saved route index
            <ShieldCheck size={18} />
          </Link>
        </div>
      </section>

      <div className="shell product-media-credit">
        <MediaCredit asset={heroMedia} compact />
        <MediaCredit asset={kineticMedia} compact />
      </div>
    </main>
  );
}
