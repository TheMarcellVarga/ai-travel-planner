import { notFound } from "next/navigation";

import { RouteActions } from "@/components/planner/route-actions";
import { getSharedRoute } from "@/lib/store/demo-store";

type SharePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;
  const sharedRoute = getSharedRoute(slug);

  if (!sharedRoute) {
    notFound();
  }

  return (
    <main className="shell share-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Shared route</p>
          <h1>{sharedRoute.route.title}</h1>
          <p className="lede">{sharedRoute.route.tagline}</p>
          <div className="tag-row">
            {sharedRoute.route.wishTags.map((tag) => (
              <span className="tag-pill" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="page-panel">
          <p className="eyebrow">Route summary</p>
          <h2>${sharedRoute.route.estimatedCostUsd}</h2>
          <p className="muted-copy">
            Confidence {Math.round(sharedRoute.route.confidence * 100)}%. Published{" "}
            {new Date(sharedRoute.publishedAt).toLocaleString()}.
          </p>
          <RouteActions routeId={sharedRoute.route.id} />
        </div>
      </section>

      <section className="results-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Stops</p>
            <h2>Journey breakdown</h2>
          </div>
        </div>
        <div className="results-grid">
          {sharedRoute.route.stops.map((stop) => (
            <article className="route-card" key={stop.id}>
              <p className="eyebrow">{stop.kind}</p>
              <h3>
                {stop.name} ({stop.code})
              </h3>
              <p className="muted-copy">{stop.country}</p>
              {stop.scene ? <p className="route-tagline">{stop.scene}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

