import { notFound } from "next/navigation";

import { getMatch } from "@/lib/actions/matches";
import { MatchScoreForm } from "./match-score-form";
import { MatchActions } from "./match-actions";

export default async function MatchDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const match = await getMatch(id);

  if (!match) {
    notFound();
  }

  const statusStyles: Record<string, string> = {
    scheduled: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    in_progress:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${statusStyles[match.status] ?? statusStyles.scheduled}`}
            >
              {match.status.replace("_", " ")}
            </span>
            {match.isKnockout && (
              <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                Knockout
              </span>
            )}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-500">
            {match.group && <span>{match.group.name} • </span>}
            Round {match.round}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-500">
          {match.competition.name}
        </div>

        {/* Score Display */}
        <div className="mt-4 flex items-center justify-center gap-8">
          <div className="flex-1 text-right">
            <div className="text-xl font-semibold text-black dark:text-white">
              {match.homeTeam?.name ?? "TBH"}
            </div>
            {match.isHomeMember && (
              <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                Your team
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {match.score ? (
              <div className="flex items-center gap-3 text-4xl font-bold">
                <span
                  className={
                    match.score.homeScore > match.score.awayScore
                      ? "text-green-600 dark:text-green-400"
                      : "text-black dark:text-white"
                  }
                >
                  {match.score.homeScore}
                </span>
                <span className="text-zinc-400">-</span>
                <span
                  className={
                    match.score.awayScore > match.score.homeScore
                      ? "text-green-600 dark:text-green-400"
                      : "text-black dark:text-white"
                  }
                >
                  {match.score.awayScore}
                </span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-zinc-400">vs</div>
            )}
          </div>

          <div className="flex-1 text-left">
            <div className="text-xl font-semibold text-black dark:text-white">
              {match.awayTeam?.name ?? "TBH"}
            </div>
            {match.isAwayMember && (
              <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                Your team
              </div>
            )}
          </div>
        </div>

        {/* Score Submission Info */}
        {match.score && (
          <div className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-500">
            {match.score.submittedBy && (
              <span>
                Submitted by {match.score.submittedBy.name}
                {match.score.confirmedBy && (
                  <span> • Confirmed by {match.score.confirmedBy.name}</span>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Match Actions (Start, Complete) */}
      {match.isMember && match.status !== "completed" && (
        <MatchActions
          matchId={match.id}
          status={match.status}
          hasScore={!!match.score}
        />
      )}

      {/* Score Form */}
      {match.canSubmitScore && match.homeTeam && match.awayTeam && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
            {match.score ? "Update Score" : "Submit Score"}
          </h3>
          <MatchScoreForm
            matchId={match.id}
            currentHomeScore={match.score?.homeScore ?? 0}
            currentAwayScore={match.score?.awayScore ?? 0}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
          />
        </div>
      )}

      {/* Team Members */}
      {match.homeTeam && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h4 className="mb-3 font-medium text-black dark:text-white">
              {match.homeTeam.name}
            </h4>
            <ul className="space-y-2">
              {match.homeTeam.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                >
                  <span className="h-2 w-2 rounded-full bg-zinc-400" />
                  {member.name || member.username}
                  {member.id === match.homeTeam?.captainUserId && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Captain
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {match.awayTeam && (
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h4 className="mb-3 font-medium text-black dark:text-white">
                {match.awayTeam.name}
              </h4>
              <ul className="space-y-2">
                {match.awayTeam.members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    <span className="h-2 w-2 rounded-full bg-zinc-400" />
                    {member.name || member.username}
                    {member.id === match.awayTeam?.captainUserId && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Captain
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
