import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { AuthLink } from "@/components/auth-link";
import { getCurrentUser } from "@/lib/auth";
import { site } from "@/lib/site";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/planner", label: "Planner" },
  { href: "/saved", label: "Saved" },
] satisfies Array<{ href: Route; label: string }>;

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <Link
        href="/"
        className="site-corner-brand"
        aria-label={`${site.name} home`}
      >
        <span className="site-corner-brand__mark">
          <Image
            className="brand-mark-small"
            src="/wild-route-mark.svg"
            alt=""
            width={36}
            height={36}
            aria-hidden="true"
          />
        </span>
        <div>
          <span className="brand-name">{site.name}</span>
          <span className="site-corner-brand__status">adventure routes</span>
        </div>
      </Link>

      <div className="site-command">
        <div className="site-command__signal" aria-hidden="true">
          <span>planner mode</span>
          <strong>prompt / score / handoff</strong>
        </div>

        <nav className="site-command__nav" aria-label="Primary">
          {navItems.map((item) => {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="site-command__nav-item"
              >
                <strong>{item.label}</strong>
              </Link>
            );
          })}
        </nav>

        <div className="site-command__actions">
          <AuthLink user={user} />
          <Link href="/planner" className="site-command__cta">
            Compose
          </Link>
        </div>
      </div>
    </header>
  );
}
