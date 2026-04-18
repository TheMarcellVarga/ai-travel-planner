import Link from "next/link";
import { Compass, Globe2, Sparkles, Ticket } from "lucide-react";

import { MediaCredit } from "@/components/media-credit";
import { destinationMedia, expeditionIndex, heroMedia, kineticMedia } from "@/lib/media";
import { wishTags } from "@/lib/site";

const highlights = [
  {
    title: "Prompt-first planning",
    text: "Describe the mood, stop rules, and trip wishes instead of filling stale airline forms.",
    icon: Sparkles
  },
  {
    title: "Cinematic map routes",
    text: "Watch each itinerary animate across the globe before committing to it.",
    icon: Globe2
  },
  {
    title: "Adventure-coded results",
    text: "Score routes for hiking, MTB, crypto-friendliness, animal-friendliness, and surf access.",
    icon: Compass
  },
  {
    title: "Booking handoff",
    text: "Find the route in Wild Route, then jump out to book each leg with external providers.",
    icon: Ticket
  }
];

const moodCards = [
  {
    title: "Canopy heat",
    text: "The opening frame should already feel humid, expensive, and slightly dangerous."
  },
  {
    title: "Tomb-raider tension",
    text: "Oversized type and sharp overlays should feel closer to a relic map than a booking form."
  },
  {
    title: "Route lust",
    text: "The user should want the place before they compare the route."
  }
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero-panel hero-panel-cinematic">
        <div className="hero-media-wrap">
          <video
            autoPlay
            className="hero-media"
            loop
            muted
            playsInline
            poster={heroMedia.poster}
          >
            <source src={heroMedia.src} type="video/webm" />
          </video>
          <div className="hero-media-overlay" />
        </div>

        <div className="hero-copy">
          <p className="eyebrow">Cinematic one-way deals for adventure nomads</p>
          <h1>Stop opening a planner that looks like accounting software.</h1>
          <p className="lede">
            Wild Route should open like a trailer: jungle water, trail speed, cliff
            drops, and destination temptation before the route logic starts talking.
          </p>
          <div className="button-row">
            <Link href="/planner" className="button">
              Open Planner
            </Link>
            <Link href="/saved" className="button button-ghost">
              View Saved Routes
            </Link>
          </div>
          <div className="tag-row" aria-label="Trip wishes">
            {wishTags.map((tag) => (
              <span className="tag-pill" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <MediaCredit asset={heroMedia} />
        </div>

        <div className="hero-stage">
          <div className="hero-stage-stack">
            <article className="signal-card signal-card-kinetic">
              <div className="kinetic-card-media">
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
                <div className="kinetic-video-overlay" />
              </div>
              <div className="signal-card-body">
                <p className="eyebrow">Kinetic layer</p>
                <strong>Route picks need motion, not only metadata.</strong>
                <span>
                  MTB, surf, jungle, and cliff energy should be visible before the
                  user clicks.
                </span>
                <MediaCredit asset={kineticMedia} compact />
              </div>
            </article>

            <div className="hero-mini-grid">
              {["bali", "cape-town", "tulum"].map((key) => {
                const card = destinationMedia[key];
                return (
                  <article className="hero-mini-card" key={key}>
                    <img alt={card.alt} className="hero-mini-image" src={card.src} />
                    <div className="hero-mini-overlay" />
                    <div className="hero-mini-copy">
                      <p className="eyebrow">Index mood</p>
                      <h3>{card.location}</h3>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="content-grid">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <article className="feature-card" key={item.title}>
              <Icon className="feature-icon" />
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          );
        })}
      </section>

      <section className="mood-section">
        <div className="section-heading">
          <p className="eyebrow">Expedition index</p>
          <h2>Every place needs a visual hook before the route logic starts talking.</h2>
        </div>
        <div className="expedition-grid">
          {expeditionIndex.map((destinationId) => {
            const card = destinationMedia[destinationId];
            return (
              <article className="expedition-card" key={destinationId}>
                <img alt={card.alt} className="expedition-image" src={card.src} />
                <div className="expedition-overlay" />
                <div className="expedition-copy">
                  <p className="eyebrow">{card.location}</p>
                  <h3>{card.punchline}</h3>
                  <MediaCredit asset={card} compact />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mood-section">
        <div className="section-heading">
          <p className="eyebrow">What the brand should feel like</p>
          <h2>Less dashboard. More field journal, trailer frame, and destination temptation.</h2>
        </div>
        <div className="mood-grid">
          {moodCards.map((card) => (
            <article className="mood-card" key={card.title}>
              <p className="eyebrow">Mood pin</p>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
