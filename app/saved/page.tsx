import Link from "next/link";

export default function SavedPage() {
  return (
    <main className="shell page-panel">
      <div className="section-heading">
        <p className="eyebrow">Saved routes</p>
        <h1>Account-backed persistence arrives in a separate feature commit.</h1>
      </div>
      <p className="lede">
        The saved-route vault, publishing flow, and booking handoff tracking are added
        after the planner engine exists.
      </p>
      <Link href="/planner" className="button">
        Open planner
      </Link>
    </main>
  );
}
