import Link from "next/link";

import { getMatchHistory } from "@/lib/actions/matches";

export default async function MatchHistoryPage() {
  const matches = await getMatchHistory();

  return (
    <div>
      <h2 className="font-display text-foreground mb-6 text-lg font-medium">
        Match History
      </h2>

      {matches.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-600 dark:text-zinc-400">
            No completed matches yet.
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Your completed matches will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchHistoryCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

type MatchData = Awaited<ReturnType<typeof getMatchHistory>>[number];

function MatchHistoryCard({ match }: Readonly<{ match: MatchData }>) {
  // Determine if user's team won
  const myTeamIsHome = match.isMyTeamHome;
  const myTeamWon = match.score
    ? myTeamIsHome
      ? match.score.homeScore > match.score.awayScore
      : match.score.awayScore > match.score.homeScore
    : false;
  const isDraw = match.score
    ? match.score.homeScore === match.score.awayScore
    : false;

  const getResultStyle = () => {
    if (myTeamWon) {
      return {
        backgroundColor: "var(--badge-group-bg)",
        color: "var(--badge-group-text)",
      };
    }
    if (isDraw) {
      return {
        backgroundColor: "var(--badge-scheduled-bg)",
        color: "var(--badge-scheduled-text)",
      };
    }
    return {
      backgroundColor: "var(--badge-draft-bg)",
      color: "var(--badge-draft-text)",
    };
  };

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {match.score && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={getResultStyle()}
              >
                {myTeamWon ? "Won" : isDraw ? "Draw" : "Lost"}
              </span>
            )}
            {match.isKnockout && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: "var(--badge-knockout-bg)",
                  color: "var(--badge-knockout-text)",
                }}
              >
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
            </div>

            <div className="flex items-center gap-2 text-lg font-bold">
              {match.score ? (
                <>
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
                </>
              ) : (
                <span className="text-zinc-400">- - -</span>
              )}
            </div>

            <div
              className={`flex-1 text-left ${!match.isMyTeamHome ? "font-semibold" : ""}`}
            >
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
          <svg
            className="h-5 w-5 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
