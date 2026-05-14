import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="shell legal-shell">
      <section className="page-panel legal-panel">
        <p className="eyebrow">Privacy</p>
        <h1>Privacy policy</h1>
        <p className="lede">
          Wild Route stores the account, route, and newsletter details needed to
          run the planner, save trips, publish shared route pages, and send
          requested email updates.
        </p>

        <div className="legal-copy">
          <h2>Data we use</h2>
          <p>
            We use trip prompts, saved routes, account identifiers, newsletter
            preferences, and billing status to provide the product. Payment
            details are handled by Stripe.
          </p>

          <h2>Your choices</h2>
          <p>
            You can export account data, update route alert preferences, and
            delete account data from the account page when signed in.
          </p>
        </div>

        <Link className="product-inline-link" href="/">
          Back to Wild Route
        </Link>
      </section>
    </main>
  );
}
