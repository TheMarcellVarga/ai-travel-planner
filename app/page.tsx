import Link from "next/link";
import { Compass, Globe2, Sparkles, Ticket } from "lucide-react";

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
    text: "A jungle-glow interface with cinematic contrast instead of travel-site beige."
  },
  {
    title: "Tomb-raider energy",
    text: "Oversized display type, mission-screen framing, and route cards meant to be shared."
  },
  {
    title: "Map as the product",
    text: "Planning centers around geography, motion, and route arcs rather than tables."
  }
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">One-way deals for adventure nomads</p>
          <h1>
            Hunt your next route on a globe that feels like a mission select screen.
          </h1>
          <p className="lede">
            Wild Route turns a travel prompt into ranked multi-stop escapes with mood
            tags, a promoted free stop, and external booking handoff when you are
            ready to act.
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
        </div>

        <div className="hero-stage">
          <div className="globe-frame">
            <div className="globe-orb" />
            <div className="globe-ring ring-a" />
            <div className="globe-ring ring-b" />
            <div className="signal-card">
              <p className="eyebrow">Free tier rule</p>
              <strong>1 promoted stop per route</strong>
              <span>Upgrade hooks stay visible without blocking route discovery.</span>
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
          <p className="eyebrow">Visual direction</p>
          <h2>Jungle green, glossy highlights, and 2000s adventure tension.</h2>
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
