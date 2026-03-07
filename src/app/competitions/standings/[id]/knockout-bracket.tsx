type KnockoutMatch = {
  id: string;
  round: number;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
};

type Props = Readonly<{
  matches: KnockoutMatch[];
}>;

function getRoundName(round: number, totalRounds: number): string {
  const roundFromEnd = totalRounds - round + 1;
  switch (roundFromEnd) {
    case 1:
      return "Final";
    case 2:
      return "Semi-Finals";
    case 3:
      return "Quarter-Finals";
    case 4:
      return "Round of 16";
    case 5:
      return "Round of 32";
    default:
      return `Round ${round}`;
  }
}

export function KnockoutBracket({ matches }: Props) {
  // Group matches by round
  const matchesByRound = new Map<number, KnockoutMatch[]>();
  let maxRound = 0;

  for (const match of matches) {
    const roundMatches = matchesByRound.get(match.round) || [];
    roundMatches.push(match);
    matchesByRound.set(match.round, roundMatches);
    maxRound = Math.max(maxRound, match.round);
  }

  const rounds = Array.from(matchesByRound.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([round, roundMatches]) => ({
      round,
      name: getRoundName(round, maxRound),
      matches: roundMatches,
    }));

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">
          No knockout matches scheduled yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rounds.map((roundData) => (
        <div key={roundData.round}>
          <h4 className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {roundData.name}
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {roundData.matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchCard({ match }: Readonly<{ match: KnockoutMatch }>) {
  const isCompleted = match.status === "completed";
  const isInProgress = match.status === "in_progress";

  return (
    <div
      className={`overflow-hidden rounded-lg border ${
        isInProgress
          ? "border-blue-300 dark:border-blue-700"
          : "border-zinc-200 dark:border-zinc-800"
      } bg-white dark:bg-zinc-900`}
    >
      {/* Match Status Badge */}
      {isInProgress && (
        <div className="bg-blue-50 px-3 py-1 text-center text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          In Progress
        </div>
      )}

      {/* Teams */}
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        <TeamRow
          teamName={match.homeTeamName}
          score={match.homeScore}
          isWinner={match.winnerId === match.homeTeamId}
          isCompleted={isCompleted}
        />
        <TeamRow
          teamName={match.awayTeamName}
          score={match.awayScore}
          isWinner={match.winnerId === match.awayTeamId}
          isCompleted={isCompleted}
        />
      </div>
    </div>
  );
}

function TeamRow({
  teamName,
  score,
  isWinner,
  isCompleted,
}: Readonly<{
  teamName: string;
  score: number | null;
  isWinner: boolean;
  isCompleted: boolean;
}>) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 ${
        isWinner && isCompleted ? "bg-green-50 dark:bg-green-900/20" : ""
      }`}
    >
      <span
        className={`text-sm ${
          isWinner && isCompleted
            ? "font-semibold text-green-700 dark:text-green-400"
            : "text-black dark:text-white"
        }`}
      >
        {teamName}
        {isWinner && isCompleted && (
          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
            W
          </span>
        )}
      </span>
      <span
        className={`text-sm font-medium ${
          isWinner && isCompleted
            ? "text-green-700 dark:text-green-400"
            : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {score !== null ? score : "-"}
      </span>
    </div>
  );
}
