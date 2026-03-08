"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { updateCompetitionStatus } from "@/lib/actions/competitions-admin";

type Status =
  | "draft"
  | "registration"
  | "group_stage"
  | "knockout"
  | "completed";
type State = { error?: string; success?: boolean } | null;

const statusStyles: Record<Status, string> = {
  draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  registration:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  group_stage:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  knockout:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  completed: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const statusLabels: Record<Status, string> = {
  draft: "Draft",
  registration: "Registration",
  group_stage: "Group Stage",
  knockout: "Knockout",
  completed: "Completed",
};

const transitions: Record<Status, Status[]> = {
  draft: ["registration"],
  registration: ["draft", "group_stage"],
  group_stage: ["knockout", "completed"],
  knockout: ["completed"],
  completed: [],
};

export function StatusManager({
  competitionId,
  currentStatus,
}: Readonly<{
  competitionId: string;
  currentStatus: Status;
}>) {
  const router = useRouter();
  const availableTransitions = transitions[currentStatus];

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prevState, formData) => {
      const newStatus = formData.get("status") as Status;
      const result = await updateCompetitionStatus(competitionId, newStatus);
      if (result.success) {
        router.refresh();
      }
      return result;
    },
    null,
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <span
        className={`rounded-full px-3 py-1 text-sm font-medium ${statusStyles[currentStatus]}`}
      >
        {statusLabels[currentStatus]}
      </span>

      {availableTransitions.length > 0 && (
        <form
          action={formAction}
          className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"
        >
          <select
            name="status"
            disabled={isPending}
            className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm text-black sm:w-auto dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          >
            {availableTransitions.map((status) => (
              <option key={status} value={status}>
                Move to {statusLabels[status]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-black px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 sm:w-auto dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isPending ? "..." : "Update"}
          </button>
        </form>
      )}

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </div>
  );
}
