import Link from "next/link";
import { headers } from "next/headers";
import { Trophy, Users, Shield, LogIn } from "lucide-react";

import { auth } from "@/lib/auth";
import { isCurrentUserAdmin } from "@/lib/actions/competitions-admin";

import { SignOutButton } from "@/app/dashboard/sign-out-button";

export async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAdmin = session?.user ? await isCurrentUserAdmin() : false;

  return (
    <header className="border-primary-light bg-surface border-b dark:border-[color-mix(in_oklab,var(--color-primary-light)_20%,transparent)] dark:bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-primary hover:text-primary/80 text-lg font-semibold transition-colors"
          >
            Pétanque
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              href="/competitions"
              className="text-muted hover:text-primary flex items-center gap-1.5 text-sm transition-colors"
            >
              <Trophy className="h-4 w-4" />
              Competitions
            </Link>

            {session?.user && (
              <>
                <Link
                  href="/teams"
                  className="text-muted hover:text-primary flex items-center gap-1.5 text-sm transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Teams
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-primary hover:text-primary/80 flex items-center gap-1.5 text-sm font-medium transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                )}
              </>
            )}

            {session?.user ? (
              <SignOutButton />
            ) : (
              <Link
                href="/"
                className="bg-primary hover:bg-primary/90 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
