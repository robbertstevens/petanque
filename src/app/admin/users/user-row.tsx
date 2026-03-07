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

export function UserRow({ user }: Readonly<{ user: User }>) {
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

  const roleStyles: Record<string, string> = {
    admin:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    super_admin:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <tr className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-black dark:text-white">
            {user.name ?? user.username ?? "Unnamed"}
          </p>
          {user.username && user.name && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              @{user.username}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
        {user.email}
      </td>
      <td className="px-4 py-3">
        {user.role ? (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${roleStyles[user.role]}`}
          >
            {user.role.replace("_", " ")}
          </span>
        ) : (
          <span className="text-sm text-zinc-400 dark:text-zinc-500">User</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
        {formatDate(user.createdAt)}
      </td>
      <td className="px-4 py-3 text-right">
        {error && (
          <span className="mr-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </span>
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
      </td>
    </tr>
  );
}
