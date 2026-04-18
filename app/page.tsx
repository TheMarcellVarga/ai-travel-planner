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

export default function HomePage() {
  return (
    <main className="planner-command-shell">
      <div className="planner-stage-globe">
        <video
          autoPlay
          className="hero-media"
          loop
          muted
          playsInline
          poster={heroMedia.poster}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        >
          <source src={heroMedia.src} type="video/webm" />
        </video>
        <div
          className="hero-media-overlay"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(115deg, rgba(3, 10, 6, 0.9) 18%, rgba(3, 10, 6, 0.6) 52%, rgba(3, 10, 6, 0.95) 100%)"
          }}
        />
      </div>

      <div className="planner-stage-header">
        <div className="planner-stage-title">
          <p className="eyebrow">Cinematic deals for adventure nomads</p>
          <h1>Stop opening a planner that looks like accounting software.</h1>
        </div>
      </div>

      <aside className="floating-sidebar floating-sidebar-left">
        <div className="floating-sidebar__inner">
          <div className="floating-sidebar__header">
            <p className="eyebrow">Welcome to Wild Route</p>
            <h2>Trailer-ready planning</h2>
            <p className="muted-copy">
              Wild Route should open like a trailer: jungle water, trail speed, cliff drops, and
              destination temptation before the route logic starts talking.
            </p>
          </div>

          <div className="button-row" style={{ marginTop: "12px", flexDirection: "column" }}>
            <Link href="/planner" className="button" style={{ width: "100%" }}>
              Open Planner
            </Link>
            <Link href="/saved" className="button button-ghost" style={{ width: "100%" }}>
              View Saved Routes
            </Link>
          </div>

          <div className="route-inspector__section" style={{ marginTop: "16px" }}>
             <p className="eyebrow">Available Filters</p>
             <div className="tag-row" aria-label="Trip wishes">
               {wishTags.map((tag) => (
                 <span className="tag-pill" key={tag}>
                   {tag}
                 </span>
               ))}
             </div>
          </div>

          <div style={{ marginTop: "auto" }}>
            <MediaCredit asset={heroMedia} compact />
          </div>
        </div>
      </aside>

      <aside className="floating-sidebar floating-sidebar-right">
        <div className="floating-sidebar__inner floating-sidebar__inner-tight">
          <div className="route-inspector__media">
            <video
              autoPlay
              className="route-inspector__image"
              loop
              muted
              playsInline
              poster={kineticMedia.poster}
              style={{ objectFit: "cover" }}
            >
              <source src={kineticMedia.src} type="video/webm" />
            </video>
            <div className="route-inspector__overlay" style={{
                background: "linear-gradient(180deg, transparent 24%, rgba(3, 10, 6, 0.95) 100%)"
            }} />
            <div className="route-inspector__copy">
              <p className="eyebrow">Kinetic layer</p>
              <strong>Route picks need motion.</strong>
              <span>MTB, surf, jungle, and cliff energy.</span>
            </div>
          </div>

          <div className="route-inspector__section">
            <p className="eyebrow">Core Features</p>
            <div className="stop-stack">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <article className="stop-card" key={item.title} style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px" }}>
                    <Icon className="feature-icon" style={{ margin: 0, marginTop: "2px", flexShrink: 0, width: "20px", height: "20px" }} />
                    <div style={{ display: "grid", gap: "2px" }}>
                      <strong>{item.title}</strong>
                      <span style={{ fontSize: "0.8rem" }}>{item.text}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
