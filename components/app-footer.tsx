import Link from "next/link";

import { NewsletterSignup } from "@/components/newsletter-signup";
import { getCurrentUser } from "@/lib/auth";

export async function AppFooter() {
  const user = await getCurrentUser();

  return (
    <footer className="shell app-footer app-footer--redesign">
      <div className="footer-departure">
        <div className="footer-departure__copy">
          <p className="eyebrow">Wild Route notes</p>
          <h2>Travel with a little more intention.</h2>
          <p>
            Compose one-way journeys, compare the meaningful stops, save the
            routes worth returning to, and book when the shape feels right.
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
