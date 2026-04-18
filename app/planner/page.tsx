import Link from "next/link";

export default function PlannerPage() {
  return (
    <main className="shell page-panel">
      <div className="section-heading">
        <p className="eyebrow">Planner workspace</p>
        <h1>Planner implementation lands in the next feature commit.</h1>
      </div>
      <p className="lede">
        This route is reserved for the full prompt-to-itinerary workflow, globe view,
        and route generation API integration.
      </p>
      <Link href="/" className="button">
        Back to home
      </Link>
    </main>
  );
}
