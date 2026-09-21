import Image from "next/image";
import Link from "next/link";

import { NewsletterSignup } from "@/components/newsletter-signup";
import { getCurrentUser } from "@/lib/auth";
import { site } from "@/lib/site";

export async function AppFooter() {
  const user = await getCurrentUser();

  return (
    <footer className="shell app-footer app-footer--redesign">
      <NewsletterSignup defaultEmail={user?.email ?? ""} />

      <div className="footer-departure">
        <Link className="footer-brand" href="/" aria-label={`${site.name} home`}>
          <Image
            src="/wild-route-logo.svg"
            alt={site.name}
            width={250}
            height={61}
          />
        </Link>
        <p>Plan the route here. Confirm prices and availability with providers.</p>
        <nav className="footer-departure__links" aria-label="Footer">
          <Link href="/planner">Planner</Link>
          <Link href="/saved">Saved routes</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
