"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { startMatch, completeMatch } from "@/lib/actions/matches";

type State = { error?: string; success?: boolean } | null;

export function MatchActions({
  matchId,
  status,
  hasScore,
}: Readonly<{
  matchId: string;
  status: string;
  hasScore: boolean;
}>) {
  const router = useRouter();

  const [startState, startAction, startPending] = useActionState<
    State,
    FormData
  >(async () => {
    const result = await startMatch(matchId);
    if (result.success) {
      router.refresh();
    }
    return result;
  }, null);

  const [completeState, completeAction, completePending] = useActionState<
    State,
    FormData
  >(async () => {
    const result = await completeMatch(matchId);
    if (result.success) {
      router.refresh();
    }
    return result;
  }, null);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {status === "scheduled" && (
          <form action={startAction}>
            <button
              type="submit"
              disabled={startPending}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {startPending ? "Starting..." : "Start Match"}
            </button>
          </form>
        )}

        {status === "in_progress" && hasScore && (
          <form action={completeAction}>
            <button
              type="submit"
              disabled={completePending}
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {completePending ? "Completing..." : "Complete Match"}
            </button>
          </form>
        )}

        {status === "in_progress" && !hasScore && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Submit a score before completing the match.
          </p>
        )}

        {startState?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {startState.error}
          </p>
        )}

        {completeState?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {completeState.error}
          </p>
        )}
      </div>
    </div>
  );
}
