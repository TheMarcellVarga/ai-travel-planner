import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="shell legal-shell">
      <section className="page-panel legal-panel">
        <p className="eyebrow">Terms</p>
        <h1>Terms of service</h1>
        <p className="lede">
          Wild Route helps compare adventure routes and create booking handoff
          links. It is a planning product, not an airline, lodging provider, or
          travel agency.
        </p>

        <div className="legal-copy">
          <h2>Route information</h2>
          <p>
            Prices, availability, transfer details, and entry requirements can
            change. Verify every booking and travel requirement with the final
            provider before purchase.
          </p>

          <h2>Accounts and billing</h2>
          <p>
            Paid plan access, route limits, and billing portal actions are
            managed through the account page and Stripe checkout.
          </p>
        </div>

        <Link className="product-inline-link" href="/">
          Back to Wild Route
        </Link>
      </section>
    </main>
  );
}
