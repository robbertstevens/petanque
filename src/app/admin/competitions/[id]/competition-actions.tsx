"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import {
  deleteCompetition,
  generateKnockoutBracket,
} from "@/lib/actions/competitions-admin";

type State = { error?: string; success?: boolean; matchCount?: number } | null;

export function CompetitionActions({
  competitionId,
  status,
}: Readonly<{
  competitionId: string;
  status: string;
}>) {
  const router = useRouter();

  const [deleteState, deleteAction, isDeleting] = useActionState<
    State,
    FormData
  >(async () => {
    const result = await deleteCompetition(competitionId);
    if (result.success) {
      router.push("/admin/competitions");
    }
    return result;
  }, null);

  const [knockoutState, knockoutAction, isGeneratingKnockout] = useActionState<
    State,
    FormData
  >(async () => {
    const result = await generateKnockoutBracket(competitionId);
    if (result.success) {
      router.refresh();
    }
    return result;
  }, null);

  return (
    <div className="space-y-4">
      {/* Generate Knockout Bracket */}
      {(status === "group_stage" || status === "knockout") && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h4 className="font-display text-foreground font-medium">
            Generate Knockout Bracket
          </h4>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Create knockout matches from group stage winners. This will select
            top teams from each group.
          </p>
          <form action={knockoutAction} className="mt-3">
            <button
              type="submit"
              disabled={isGeneratingKnockout}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
            >
              {isGeneratingKnockout
                ? "Generating..."
                : "Generate Knockout Bracket"}
            </button>
          </form>
          {knockoutState?.success && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              Created {knockoutState.matchCount} knockout matches
            </p>
          )}
          {knockoutState?.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {knockoutState.error}
            </p>
          )}
        </div>
      )}

      {/* Delete Competition */}
      {status === "draft" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
          <h4 className="font-display font-medium text-red-800 dark:text-red-400">
            Delete Competition
          </h4>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400/80">
            This action cannot be undone. The competition can only be deleted
            while in draft status.
          </p>
          <form action={deleteAction} className="mt-3">
            <button
              type="submit"
              disabled={isDeleting}
              onClick={(e) => {
                if (
                  !confirm("Are you sure you want to delete this competition?")
                ) {
                  e.preventDefault();
                }
              }}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete Competition"}
            </button>
          </form>
          {deleteState?.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {deleteState.error}
            </p>
          )}
        </div>
      )}

      {status !== "draft" &&
        status !== "group_stage" &&
        status !== "knockout" && (
          <p className="text-zinc-600 dark:text-zinc-400">
            No additional actions available for this competition status.
          </p>
        )}
    </div>
  );
}
