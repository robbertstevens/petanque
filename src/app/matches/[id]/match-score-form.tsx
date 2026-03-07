"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { submitMatchScore } from "@/lib/actions/matches";

type State = { error?: string; success?: boolean } | null;

export function MatchScoreForm({
  matchId,
  currentHomeScore,
  currentAwayScore,
  homeTeamName,
  awayTeamName,
}: Readonly<{
  matchId: string;
  currentHomeScore: number;
  currentAwayScore: number;
  homeTeamName: string;
  awayTeamName: string;
}>) {
  const router = useRouter();
  const [homeScore, setHomeScore] = useState(currentHomeScore);
  const [awayScore, setAwayScore] = useState(currentAwayScore);

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async () => {
      const result = await submitMatchScore(matchId, homeScore, awayScore);
      if (result.success) {
        router.refresh();
      }
      return result;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center justify-center gap-6">
        <div className="text-center">
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {homeTeamName}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
              disabled={isPending}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 bg-zinc-100 text-lg font-bold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              -
            </button>
            <input
              type="number"
              min="0"
              max="13"
              value={homeScore}
              onChange={(e) =>
                setHomeScore(Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              className="h-14 w-20 rounded-lg border border-zinc-300 text-center text-2xl font-bold text-black focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setHomeScore(Math.min(13, homeScore + 1))}
              disabled={isPending}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 bg-zinc-100 text-lg font-bold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              +
            </button>
          </div>
        </div>

        <div className="text-2xl font-bold text-zinc-400">-</div>

        <div className="text-center">
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {awayTeamName}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
              disabled={isPending}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 bg-zinc-100 text-lg font-bold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              -
            </button>
            <input
              type="number"
              min="0"
              max="13"
              value={awayScore}
              onChange={(e) =>
                setAwayScore(Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              className="h-14 w-20 rounded-lg border border-zinc-300 text-center text-2xl font-bold text-black focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setAwayScore(Math.min(13, awayScore + 1))}
              disabled={isPending}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 bg-zinc-100 text-lg font-bold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="text-center text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-black px-6 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isPending ? "Saving..." : "Save Score"}
        </button>
      </div>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
        In petanque, the first team to reach 13 points wins.
      </p>
    </form>
  );
}
