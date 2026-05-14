import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Compass, Heart, LayoutDashboard, Target } from "lucide-react";

import { AuthLink } from "@/components/auth-link";
import { getCurrentUser } from "@/lib/auth";
import { site } from "@/lib/site";

const navItems = [
  { href: "/", label: "Home", icon: Compass },
  { href: "/planner", label: "Planner", icon: Target },
  { href: "/saved", label: "Saved", icon: Heart },
] satisfies Array<{ href: Route; label: string; icon: any }>;

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <div className="site-header-glass">
        <Link
          href="/"
          className="brand-minimal"
          aria-label={`${site.name} home`}
        >
          <Image
            className="brand-mark-small"
            src="/wild-route-mark.svg"
            alt=""
            width={32}
            height={32}
            aria-hidden="true"
          />
          <div className="brand-status">
            <span className="brand-name">{site.name}</span>
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span className="status-text">Network Live</span>
            </div>
          </div>
        </Link>

        <nav className="site-nav-console" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-item-console"
              >
                <Icon size={16} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="site-actions-minimal">
          <AuthLink user={user} />
          <Link href="/planner" className="button-sm button-primary-sm">
            Launch Planner
          </Link>
        </div>
      </div>
    </header>
  );
}
