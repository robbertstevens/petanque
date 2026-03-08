import Link from "next/link";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { isCurrentUserAdmin } from "@/lib/actions/competitions-admin";

import { SignOutButton } from "@/app/dashboard/sign-out-button";

export async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAdmin = session?.user ? await isCurrentUserAdmin() : false;

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-lg font-semibold text-black dark:text-white"
          >
            Pétanque
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              href="/competitions"
              className="text-sm text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Competitions
            </Link>

            {session?.user && (
              <>
                <Link
                  href="/teams"
                  className="text-sm text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
                >
                  Teams
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-purple-600 transition-colors hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
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
                className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
