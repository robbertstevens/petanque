import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

import { auth } from "@/lib/auth";
import {
  isCurrentUserAdminOrSuperAdmin,
  isCurrentUserSuperAdmin,
} from "@/lib/actions/users";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const isAdminOrSuperAdmin = await isCurrentUserAdminOrSuperAdmin();

  if (!isAdminOrSuperAdmin) {
    redirect("/dashboard");
  }

  const isSuperAdmin = await isCurrentUserSuperAdmin();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <h1 className="font-display text-foreground text-xl font-semibold">
              Admin Panel
            </h1>
            <nav className="flex gap-4">
              <Link
                href="/admin"
                className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/competitions"
                className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
              >
                Competitions
              </Link>
              {isSuperAdmin && (
                <Link
                  href="/admin/users"
                  className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
                >
                  Users
                </Link>
              )}
            </nav>
          </div>
          <Link
            href="/"
            className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
          >
            Back to App
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
