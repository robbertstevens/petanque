"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateMatchScore } from "@/lib/actions/competitions-admin";

type Match = {
  id: string;
  round: number;
  isKnockout: boolean;
  status: string;
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  score: { homeScore: number; awayScore: number } | null;
};

type Group = {
  id: string;
  name: string;
  matches: Match[];
};

type State = { error?: string; success?: boolean } | null;

export function MatchesManager({
  groups,
  matches,
  status,
}: Readonly<{
  competitionId: string;
  groups: Group[];
  matches: Match[];
  status: string;
}>) {
  const knockoutMatches = matches.filter((m) => m.isKnockout);
  const canEditScores = status === "group_stage" || status === "knockout";

  return (
    <div className="space-y-6">
      {/* Group Stage Matches */}
      {groups.map((group) => (
        <div key={group.id}>
          <h4 className="mb-3 font-medium text-black dark:text-white">
            {group.name}
          </h4>
          {group.matches.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No matches scheduled. Generate schedule from the Groups section.
            </p>
          ) : (
            <MatchesTable
              matches={group.matches}
              canEditScores={canEditScores}
            />
          )}
        </div>
      ))}

      {/* Knockout Matches */}
      {knockoutMatches.length > 0 && (
        <div>
          <h4 className="mb-3 font-medium text-black dark:text-white">
            Knockout Stage
          </h4>
          <MatchesTable
            matches={knockoutMatches}
            canEditScores={canEditScores}
          />
        </div>
      )}

      {groups.every((g) => g.matches.length === 0) &&
        knockoutMatches.length === 0 && (
          <p className="text-zinc-600 dark:text-zinc-400">
            No matches scheduled yet.
          </p>
        )}
    </div>
  );
}

function MatchesTable({
  matches,
  canEditScores,
}: Readonly<{
  matches: Match[];
  canEditScores: boolean;
}>) {
  // Sort by round
  const sortedMatches = [...matches].sort((a, b) => a.round - b.round);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full">
        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Round
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Home
            </th>
            <th className="px-4 py-2 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Score
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Away
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Status
            </th>
            {canEditScores && (
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
          {sortedMatches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              canEditScores={canEditScores}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchRow({
  match,
  canEditScores,
}: Readonly<{
  match: Match;
  canEditScores: boolean;
}>) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [homeScore, setHomeScore] = useState(match.score?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(match.score?.awayScore ?? 0);

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async () => {
      const result = await updateMatchScore(match.id, homeScore, awayScore);
      if (result.success) {
        setIsEditing(false);
        router.refresh();
      }
      return result;
    },
    null,
  );

  const statusStyles: Record<string, string> = {
    scheduled: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    in_progress:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <tr>
      <td className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
        {match.round}
      </td>
      <td className="px-4 py-2 text-sm font-medium text-black dark:text-white">
        {match.homeTeam?.name ?? "TBH"}
      </td>
      <td className="px-4 py-2 text-center">
        {isEditing ? (
          <div className="flex items-center justify-center gap-1">
            <input
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(parseInt(e.target.value, 10) || 0)}
              className="w-12 rounded border border-zinc-300 px-2 py-1 text-center text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
            <span className="text-zinc-400">-</span>
            <input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(parseInt(e.target.value, 10) || 0)}
              className="w-12 rounded border border-zinc-300 px-2 py-1 text-center text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
        ) : match.score ? (
          <span className="font-medium text-black dark:text-white">
            {match.score.homeScore} - {match.score.awayScore}
          </span>
        ) : (
          <span className="text-zinc-400">- - -</span>
        )}
      </td>
      <td className="px-4 py-2 text-sm font-medium text-black dark:text-white">
        {match.awayTeam?.name ?? "TBH"}
      </td>
      <td className="px-4 py-2">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[match.status] ?? statusStyles.scheduled}`}
        >
          {match.status.replace("_", " ")}
        </span>
      </td>
      {canEditScores && (
        <td className="px-4 py-2">
          {isEditing ? (
            <div className="flex gap-2">
              <form action={formAction}>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {isPending ? "..." : "Save"}
                </button>
              </form>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              {state?.error && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  {state.error}
                </span>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Edit Score
            </button>
          )}
        </td>
      )}
    </tr>
  );
}
