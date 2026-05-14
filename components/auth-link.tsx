import Link from "next/link";

import type { AppUser } from "@/lib/types";

type AuthLinkProps = {
  user: AppUser | null;
};

export function AuthLink({ user }: AuthLinkProps) {
  if (!user) {
    return (
      <Link href="/auth" className="auth-chip">
        <span>guest</span>
        <strong>Sign in</strong>
      </Link>
    );
  }

  return (
    <Link href="/account" className="auth-chip auth-chip-active">
      <span>account</span>
      <strong>{user.name}</strong>
    </Link>
  );
}
