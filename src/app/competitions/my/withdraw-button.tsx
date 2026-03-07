"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { withdrawTeamFromCompetition } from "@/lib/actions/competitions";

type State = { error?: string; success?: boolean } | null;

export function WithdrawButton({
  competitionId,
  competitionName,
  teamId,
  teamName,
}: Readonly<{
  competitionId: string;
  competitionName: string;
  teamId: string;
  teamName: string;
}>) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async () => {
      const result = await withdrawTeamFromCompetition(competitionId, teamId);
      return result;
    },
    null,
  );

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const confirmed = confirm(
      `Are you sure you want to withdraw "${teamName}" from "${competitionName}"?`,
    );
    if (!confirmed) {
      e.preventDefault();
    }
  };

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You can withdraw your team while registration is open.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
        >
          {isPending ? "Withdrawing..." : "Withdraw Team"}
        </button>
      </div>
      {state?.error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
