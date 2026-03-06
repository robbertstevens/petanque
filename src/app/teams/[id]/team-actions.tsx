"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { leaveTeam, deleteTeam } from "@/lib/actions/teams";

type State = { error?: string; success?: boolean } | null;

export function TeamActions({
  teamId,
  isCaptain,
  isMember,
}: Readonly<{
  teamId: string;
  isCaptain: boolean;
  isMember: boolean;
}>) {
  const router = useRouter();

  const [leaveState, leaveAction, isLeaving] = useActionState<State, FormData>(
    async () => {
      const result = await leaveTeam(teamId);
      if (result.success) {
        router.push("/teams");
      }
      return result;
    },
    null,
  );

  const [deleteState, deleteAction, isDeleting] = useActionState<
    State,
    FormData
  >(async () => {
    const result = await deleteTeam(teamId);
    if (result.success) {
      router.push("/teams");
    }
    return result;
  }, null);

  const isPending = isLeaving || isDeleting;

  return (
    <div className="space-y-4">
      {/* Leave Team (non-captain members only) */}
      {isMember && !isCaptain && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="font-medium text-black dark:text-white">Leave Team</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            You will no longer be a member of this team.
          </p>
          <form action={leaveAction} className="mt-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              {isLeaving ? "Leaving..." : "Leave Team"}
            </button>
          </form>
          {leaveState?.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {leaveState.error}
            </p>
          )}
        </div>
      )}

      {/* Delete Team (captain only) */}
      {isCaptain && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
          <h3 className="font-medium text-red-800 dark:text-red-400">
            Delete Team
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400/80">
            This action cannot be undone. All team data will be permanently
            deleted.
          </p>
          <form action={deleteAction} className="mt-3">
            <button
              type="submit"
              disabled={isPending}
              onClick={(e) => {
                if (!confirm("Are you sure you want to delete this team?")) {
                  e.preventDefault();
                }
              }}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete Team"}
            </button>
          </form>
          {deleteState?.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {deleteState.error}
            </p>
          )}
        </div>
      )}

      {/* Non-member view */}
      {!isMember && (
        <p className="text-zinc-600 dark:text-zinc-400">
          You are not a member of this team.
        </p>
      )}
    </div>
  );
}
