"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { promoteUserToAdmin, demoteAdmin } from "@/lib/actions/users";

type User = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  createdAt: Date;
  role: "admin" | "super_admin" | null;
};

type State = { error?: string; success?: boolean } | null;

export function UserActions({ user }: Readonly<{ user: User }>) {
  const router = useRouter();

  const [promoteState, promoteAction, isPromoting] = useActionState<
    State,
    FormData
  >(async () => {
    const result = await promoteUserToAdmin(user.id);
    if (result.success) {
      router.refresh();
    }
    return result;
  }, null);

  const [demoteState, demoteAction, isDemoting] = useActionState<
    State,
    FormData
  >(async () => {
    const result = await demoteAdmin(user.id);
    if (result.success) {
      router.refresh();
    }
    return result;
  }, null);

  const isPending = isPromoting || isDemoting;
  const error = promoteState?.error ?? demoteState?.error;

  return (
    <div className="flex items-center justify-end gap-2">
      {error && (
        <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
      )}
      {user.role === "super_admin" ? (
        <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
      ) : user.role === "admin" ? (
        <form action={demoteAction} className="inline">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {isDemoting ? "..." : "Remove Admin"}
          </button>
        </form>
      ) : (
        <form action={promoteAction} className="inline">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50"
          >
            {isPromoting ? "..." : "Make Admin"}
          </button>
        </form>
      )}
    </div>
  );
}
