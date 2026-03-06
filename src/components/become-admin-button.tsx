"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  isCurrentUserAdmin,
  makeUserAdmin,
} from "@/lib/actions/competitions";

type State = { error?: string; success?: boolean } | null;

export function BecomeAdminButton({ userId }: Readonly<{ userId: string }>) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    isCurrentUserAdmin()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
  }, []);

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async () => {
      const result = await makeUserAdmin(userId);
      if (result.success) {
        setIsAdmin(true);
        router.refresh();
      }
      return result;
    },
    null,
  );

  // Already admin or still loading
  if (isAdmin === null || isAdmin) return null;

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30"
      >
        {isPending ? "..." : "Become Admin (Dev)"}
      </button>
      {state?.error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
