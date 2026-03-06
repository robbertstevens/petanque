"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isCurrentUserAdmin } from "@/lib/actions/competitions";

export function AdminLink() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    isCurrentUserAdmin()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin"
      className="block w-full rounded-md bg-orange-100 px-4 py-3 text-center font-medium text-orange-800 transition-colors hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50"
    >
      Admin Panel
    </Link>
  );
}
