import Link from "next/link";

import { NewsletterSignup } from "@/components/newsletter-signup";
import { getCurrentUser } from "@/lib/auth";

export async function AppFooter() {
  const user = await getCurrentUser();

  return (
    <footer className="shell app-footer app-footer--redesign">
      <div className="footer-departure">
        <div className="footer-departure__copy">
          <p className="eyebrow">Wild Route dispatch</p>
          <h2>Make the next route easier to choose.</h2>
          <p>
            A planning surface for one-way adventure trips, route cards, saved
            vaults, public shares, and provider handoff.
          </p>
        </div>
        <nav className="footer-departure__links" aria-label="Footer">
          <Link href="/planner">Planner</Link>
          <Link href="/saved">Route vault</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>

      <NewsletterSignup defaultEmail={user?.email ?? ""} />
    </footer>
  );
}
