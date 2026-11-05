import Link from "next/link";

import type { AppUser } from "@/lib/types";

type AuthLinkProps = {
  user: AppUser | null;
};

export function AuthLink({ user }: AuthLinkProps) {
  if (!user || user.authMode === "demo") {
    return (
      <Link href="/auth" className="auth-chip">
        <strong>Sign in</strong>
      </Link>
    );
  }

  return (
    <Link href="/account" className="auth-chip auth-chip-active">
      <strong>{user.name}</strong>
    </Link>
  );
}
