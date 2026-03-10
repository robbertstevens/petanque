import Link from "next/link";

type Match = {
  id: string;
  round: number;
  isKnockout: boolean;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduledAt: Date | null;
  homeTeam: {
    id: string;
    name: string;
  } | null;
  awayTeam: {
    id: string;
    name: string;
  } | null;
  group: { id: string; name: string } | null;
  score: { homeScore: number; awayScore: number } | null;
};

type Props = Readonly<{
  upcoming: Match[];
  completed: Match[];
  isAuthenticated?: boolean;
}>;

export function ScheduleSection({
  upcoming,
  completed,
  isAuthenticated = false,
}: Props) {
  if (upcoming.length === 0 && completed.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">
          No matches scheduled yet.
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
          Matches will be scheduled once the competition moves to group stage.
        </p>
      </div>
    );
  }

  // Group matches by round
  const upcomingByRound = groupByRound(upcoming);
  const completedByRound = groupByRound(completed);

  return (
    <div className="space-y-8">
      {/* Upcoming Matches */}
      {upcoming.length > 0 && (
        <section>
          <h3 className="font-display text-foreground mb-4 text-lg font-medium">
            Upcoming Matches
          </h3>
          {Object.entries(upcomingByRound).map(([round, matches]) => (
            <div key={`upcoming-${round}`} className="mb-6">
              <h4 className="font-display text-muted-foreground mb-3 text-sm font-medium">
                Round {round}
              </h4>
              <div className="space-y-3">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Completed Matches */}
      {completed.length > 0 && (
        <section>
          <h3 className="font-display text-foreground mb-4 text-lg font-medium">
            Completed Matches
          </h3>
          {Object.entries(completedByRound).map(([round, matches]) => (
            <div key={`completed-${round}`} className="mb-6">
              <h4 className="font-display text-muted-foreground mb-3 text-sm font-medium">
                Round {round}
              </h4>
              <div className="space-y-3">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function groupByRound(matches: Match[]): Record<string, Match[]> {
  const grouped: Record<string, Match[]> = {};
  for (const match of matches) {
    const key = match.isKnockout
      ? getKnockoutRoundName(match.round)
      : `Group ${match.round}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(match);
  }
  return grouped;
}

function getKnockoutRoundName(round: number): string {
  const names: Record<number, string> = {
    1: "Quarter-Finals",
    2: "Semi-Finals",
    3: "Final",
  };
  return names[round] || `Round ${round}`;
}

function MatchCard({
  match,
  isAuthenticated = false,
}: Readonly<{ match: Match; isAuthenticated?: boolean }>) {
  const getMatchStatusStyle = (status: string) => {
    switch (status) {
      case "scheduled":
        return {
          backgroundColor: "var(--badge-scheduled-bg)",
          color: "var(--badge-scheduled-text)",
        };
      case "in_progress":
        return {
          backgroundColor: "var(--badge-group-bg)",
          color: "var(--badge-group-text)",
        };
      case "completed":
        return {
          backgroundColor: "var(--badge-completed-bg)",
          color: "var(--badge-completed-text)",
        };
      case "cancelled":
        return {
          backgroundColor: "var(--badge-draft-bg)",
          color: "var(--badge-draft-text)",
        };
      default:
        return {
          backgroundColor: "var(--badge-scheduled-bg)",
          color: "var(--badge-scheduled-text)",
        };
    }
  };

  const homeWon = match.score && match.score.homeScore > match.score.awayScore;
  const awayWon = match.score && match.score.awayScore > match.score.homeScore;

  const content = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span
            className="rounded-full px-2 py-0.5 font-medium"
            style={getMatchStatusStyle(match.status)}
          >
            {match.status.replace("_", " ")}
          </span>
          {match.isKnockout && (
            <span
              className="rounded-full px-2 py-0.5 font-medium"
              style={{
                backgroundColor: "var(--badge-knockout-bg)",
                color: "var(--badge-knockout-text)",
              }}
            >
              Knockout
            </span>
          )}
          {match.group && (
            <span className="text-zinc-500 dark:text-zinc-400">
              {match.group.name}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex-1">
          <span
            className={
              homeWon
                ? "font-semibold text-green-600 dark:text-green-400"
                : "text-black dark:text-white"
            }
          >
            {match.homeTeam?.name ?? "TBH"}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 text-lg font-bold">
          {match.score ? (
            <>
              <span
                className={
                  homeWon
                    ? "text-green-600 dark:text-green-400"
                    : "text-black dark:text-white"
                }
              >
                {match.score.homeScore}
              </span>
              <span className="text-zinc-400">-</span>
              <span
                className={
                  awayWon
                    ? "text-green-600 dark:text-green-400"
                    : "text-black dark:text-white"
                }
              >
                {match.score.awayScore}
              </span>
            </>
          ) : (
            <span className="text-zinc-400">vs</span>
          )}
        </div>
        <div className="flex-1 text-right">
          <span
            className={
              awayWon
                ? "font-semibold text-green-600 dark:text-green-400"
                : "text-black dark:text-white"
            }
          >
            {match.awayTeam?.name ?? "TBH"}
          </span>
        </div>
      </div>
    </>
  );

  if (isAuthenticated) {
    return (
      <Link
        href={`/matches/${match.id}`}
        className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="block rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {content}
    </div>
  );
}
