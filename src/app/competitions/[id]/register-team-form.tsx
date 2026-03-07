"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { registerTeamForCompetition } from "@/lib/actions/competitions";

type Team = Readonly<{
  id: string;
  name: string;
  memberCount: number;
}>;

type State = { error?: string; success?: boolean } | null;

export function RegisterTeamForm({
  competitionId,
  teams,
}: Readonly<{
  competitionId: string;
  teams: Team[];
}>) {
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || "");

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async () => {
      if (!selectedTeamId) {
        return { error: "Please select a team" };
      }
      const result = await registerTeamForCompetition(
        competitionId,
        selectedTeamId,
      );
      return result;
    },
    null,
  );

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  if (teams.length === 0) {
    return null;
  }

  return (
    <form action={formAction}>
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <label
          htmlFor="team"
          className="mb-2 block text-sm font-medium text-black dark:text-white"
        >
          Select a team to register
        </label>
        <div className="flex gap-3">
          <select
            id="team"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            disabled={isPending}
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black focus:border-black focus:ring-1 focus:ring-black focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.memberCount} members)
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isPending || !selectedTeamId}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isPending ? "Registering..." : "Register Team"}
          </button>
        </div>
        {state?.error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
            Team registered successfully!
          </p>
        )}
      </div>
    </form>
  );
}
