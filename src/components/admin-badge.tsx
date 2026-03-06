"use client";

import { useEffect, useState } from "react";

import { isCurrentUserAdmin } from "@/lib/actions/competitions";

export function AdminBadge() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    isCurrentUserAdmin()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
  }, []);

  if (!isAdmin) return null;

  return (
    <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
      Admin
    </span>
  );
}
