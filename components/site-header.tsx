import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { AuthLink } from "@/components/auth-link";
import { getCurrentUser } from "@/lib/auth";
import { site } from "@/lib/site";

const navItems = [
  { href: "/", label: "Index", code: "01" },
  { href: "/planner", label: "Planner", code: "02" },
  { href: "/saved", label: "Vault", code: "03" },
] satisfies Array<{ href: Route; label: string; code: string }>;

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <div className="site-command">
        <Link
          href="/"
          className="site-command__brand"
          aria-label={`${site.name} home`}
        >
          <span className="site-command__mark">
            <Image
              className="brand-mark-small"
              src="/wild-route-mark.svg"
              alt=""
              width={32}
              height={32}
              aria-hidden="true"
            />
          </span>
          <div>
            <span className="brand-name">{site.name}</span>
            <span className="site-command__status">terrain index online</span>
          </div>
        </Link>

        <div className="site-command__signal" aria-hidden="true">
          <span>route os</span>
          <strong>SIN · 12d · max 1 stop</strong>
        </div>

        <nav className="site-command__nav" aria-label="Primary">
          {navItems.map((item) => {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="site-command__nav-item"
              >
                <span>{item.code}</span>
                <strong>{item.label}</strong>
              </Link>
            );
          })}
        </nav>

        <div className="site-command__actions">
          <AuthLink user={user} />
          <Link href="/planner" className="site-command__cta">
            Start
          </Link>
        </div>
      </div>
    </header>
  );
}
