import Link from "next/link";

import type { AppUser } from "@/lib/types";

type AuthLinkProps = {
  user: AppUser | null;
};

export function AuthLink({ user }: AuthLinkProps) {
  if (!user) {
    return (
      <Link href="/auth" className="button button-ghost">
        Sign In
      </Link>
    );
  }

  return (
    <Link href="/auth" className="button button-ghost">
      {user.name}
    </Link>
  );
}

