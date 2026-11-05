import Image from "next/image";
import Link from "next/link";

import { site } from "@/lib/site";

export function AppFooter() {

  return (
    <footer className="shell app-footer app-footer--redesign">
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
