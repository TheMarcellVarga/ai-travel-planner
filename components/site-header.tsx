import type { Route } from "next";
import Link from "next/link";

import { AuthLink } from "@/components/auth-link";
import { getCurrentUser } from "@/lib/auth";
import { site } from "@/lib/site";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/planner", label: "Planner" },
  { href: "/saved", label: "Saved" }
] satisfies Array<{ href: Route; label: string }>;

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="shell site-header">
      <Link href="/" className="brand" aria-label={`${site.name} home`}>
        <img className="brand-mark" src="/wild-route-mark.svg" alt="" aria-hidden="true" />
        <span className="brand-copy">
          <span className="eyebrow">AI Travel Planner</span>
          <strong>{site.name}</strong>
        </span>
      </Link>

      <nav className="site-nav" aria-label="Primary">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="site-actions">
        <AuthLink user={user} />
        <Link href="/planner" className="button">
          Start Planning
        </Link>
      </div>
    </header>
  );
}
