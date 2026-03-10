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
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-foreground text-xl font-semibold">
              Admin Panel
            </h1>
          </div>
          <nav className="mt-4 flex gap-4">
            <NavLink href="/admin">Dashboard</NavLink>
            <NavLink href="/admin/competitions">Competitions</NavLink>
            {isSuperAdmin && <NavLink href="/admin/users">Users</NavLink>}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
    >
      {children}
    </Link>
  );
}
