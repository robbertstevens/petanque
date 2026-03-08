import Link from "next/link";
import {
  Clock,
  PlayCircle,
  CheckCircle2,
  Trophy,
  XCircle,
  Inbox,
  ChevronRight,
} from "lucide-react";

import { getUpcomingMatches } from "@/lib/actions/matches";

export default async function MatchesPage() {
  const matches = await getUpcomingMatches();

  return (
    <div>
      <h2 className="mb-6 flex items-center gap-2 text-lg font-medium text-black dark:text-white">
        <Clock className="h-5 w-5" />
        Upcoming Matches
      </h2>

      {matches.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Inbox className="mx-auto mb-3 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <p className="text-zinc-600 dark:text-zinc-400">
            No upcoming matches for your teams.
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Matches will appear here once your teams are registered in active
            competitions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

type MatchData = Awaited<ReturnType<typeof getUpcomingMatches>>[number];

function MatchCard({ match }: Readonly<{ match: MatchData }>) {
  const statusStyles: Record<string, string> = {
    scheduled: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    in_progress:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    scheduled: <Clock className="h-3 w-3" />,
    in_progress: <PlayCircle className="h-3 w-3" />,
    completed: <CheckCircle2 className="h-3 w-3" />,
    cancelled: <XCircle className="h-3 w-3" />,
  };

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[match.status] ?? statusStyles.scheduled}`}
            >
              {statusIcons[match.status]}
              {match.status.replace("_", " ")}
            </span>
            {match.isKnockout && (
              <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                <Trophy className="h-3 w-3" />
                Knockout
              </span>
            )}
            {match.group && (
              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                {match.group.name} • Round {match.round}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4">
            <div
              className={`flex-1 text-right ${match.isMyTeamHome ? "font-semibold" : ""}`}
            >
              <span
                className={
                  match.isMyTeamHome
                    ? "text-black dark:text-white"
                    : "text-zinc-600 dark:text-zinc-400"
                }
              >
                {match.homeTeam?.name ?? "TBH"}
              </span>
              {match.isMyTeamHome && (
                <span className="ml-2 text-xs text-zinc-500">(Your team)</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-lg font-bold">
              {match.score ? (
                <>
                  <span className="text-black dark:text-white">
                    {match.score.homeScore}
                  </span>
                  <span className="text-zinc-400">-</span>
                  <span className="text-black dark:text-white">
                    {match.score.awayScore}
                  </span>
                </>
              ) : (
                <span className="text-zinc-400">vs</span>
              )}
            </div>

            <div
              className={`flex-1 text-left ${!match.isMyTeamHome ? "font-semibold" : ""}`}
            >
              {!match.isMyTeamHome && (
                <span className="mr-2 text-xs text-zinc-500">(Your team)</span>
              )}
              <span
                className={
                  !match.isMyTeamHome
                    ? "text-black dark:text-white"
                    : "text-zinc-600 dark:text-zinc-400"
                }
              >
                {match.awayTeam?.name ?? "TBH"}
              </span>
            </div>
          </div>

          <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
            {match.competition.name}
          </div>
        </div>

        <div className="ml-4">
          <ChevronRight className="h-5 w-5 text-zinc-400" />
        </div>
      </div>
    </Link>
  );
}
