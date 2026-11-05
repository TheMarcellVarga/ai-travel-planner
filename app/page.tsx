import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MediaCredit } from "@/components/media-credit";
import { ResilientImage } from "@/components/resilient-image";
import { destinations } from "@/lib/data/destinations";
import { getDestinationMedia } from "@/lib/media";

const featuredDestinations = destinations.slice(0, 3);

export default function HomePage() {
  return (
    <main className="journey-index demo-home">
      <section className="atlas-hero">
        <div className="atlas-hero__media" aria-hidden="true">
          <Image alt="" className="atlas-hero__image" src="/editorial/route-ribbon-hero.png" fill priority sizes="100vw" />
        </div>
        <div className="atlas-hero__wash" />
        <div className="shell atlas-hero__grid">
          <div className="atlas-hero__copy">
            <h1>A little less planning. A little more adventure.</h1>
            <p className="atlas-hero__lede">
              Tell us what you love. Compare routes, explore the stops,
              and save a trip worth taking.
            </p>
            <div className="atlas-hero__actions">
              <Link className="button button-island" href="/planner">
                <span>Plan a route</span>
                <span className="button-island__icon" aria-hidden="true"><ArrowRight size={17} /></span>
              </Link>
            </div>
            <p className="demo-home__disclosure">
              Interactive demo · curated destinations and app-scored routes.
              Confirm prices and availability with external providers.
            </p>
          </div>
          <aside className="route-console" aria-label="Example trip brief">
            <div className="route-console__header"><span>Your next adventure</span><small>Example brief</small></div>
            <p className="route-console__prompt">“12 days from Singapore. Hiking, surf, and somewhere new.”</p>
            <div className="route-console__routes">
              {featuredDestinations.map((destination) => (
                <div key={destination.id} className="route-console__route">
                  <span>{destination.code}</span>
                  <div><strong>{destination.name}</strong><small>{destination.country}</small></div>
                  <ArrowRight size={16} aria-hidden="true" />
                </div>
              ))}
            </div>
            <p className="demo-home__example-note">A few places in the catalog. Your brief shapes the route.</p>
          </aside>
        </div>
      </section>
      <section className="shell atlas-section demo-destinations">
        <div className="atlas-section__heading">
          <h2>Where could you go?</h2>
          <p>Start with a place. Make the journey your own.</p>
        </div>
        <div className="demo-destinations__grid">
          {featuredDestinations.map((destination) => {
            const media = getDestinationMedia(destination.id);
            return (
              <article key={destination.id} className="demo-destination">
                <div className="demo-destination__media">
                  <ResilientImage alt={media.alt} src={media.src} fill sizes="(max-width: 760px) 100vw, 33vw" />
                </div>
                <div className="demo-destination__caption"><h3>{destination.name}</h3><span>{destination.country}</span></div>
                <MediaCredit asset={media} compact />
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
