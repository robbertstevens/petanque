"use client";

import Link from "next/link";
import { Trophy, Users, Shield, LogIn, LogOut } from "lucide-react";

import { useSession } from "@/hooks/use-session";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { signOut } from "@/lib/auth-client";
import { MobileMenu } from "./mobile-menu";

export function Header() {
  const { session, isLoading } = useSession();
  const { isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();

  const isAuthenticated = !!session;

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  if (isLoading || isLoadingAdmin) {
    return (
      <header className="border-primary-light bg-surface border-b dark:border-[color-mix(in_oklab,var(--color-primary-light)_20%,transparent)] dark:bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-14 items-center justify-between">
            <Link
              href="/"
              className="text-primary hover:text-primary/80 font-display text-3xl font-semibold uppercase transition-colors"
            >
              Pétanque
            </Link>
            <div className="bg-primary-light h-6 w-6 animate-pulse rounded" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-primary-light bg-surface border-b dark:border-[color-mix(in_oklab,var(--color-primary-light)_20%,transparent)] dark:bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-primary hover:text-primary/80 font-display text-3xl font-semibold uppercase transition-colors"
          >
            Pétanque
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/competitions"
              className="text-muted hover:text-primary flex items-center gap-1.5 text-sm transition-colors"
            >
              <Trophy className="h-4 w-4" />
              Competitions
            </Link>

            {isAuthenticated && (
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

            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="hover:bg-primary-light flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
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

          {/* Mobile Menu */}
          <div className="md:hidden">
            <MobileMenu isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </header>
  );
}
