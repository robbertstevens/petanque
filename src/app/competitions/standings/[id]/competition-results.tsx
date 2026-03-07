import type { GroupStandings } from "@/lib/actions/competitions";

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
  winner: { teamId: string; teamName: string } | null;
  groupStandings: GroupStandings[];
  knockoutMatches: KnockoutMatch[];
}>;

export function CompetitionResults({
  winner,
  groupStandings,
  knockoutMatches,
}: Props) {
  // Get runner-up from knockout final or second place in groups
  const runnerUp = getRunnerUp(knockoutMatches, groupStandings, winner);

  // Get final match if exists
  const maxRound =
    knockoutMatches.length > 0
      ? Math.max(...knockoutMatches.map((m) => m.round))
      : 0;
  const finalMatch = knockoutMatches.find(
    (m) => m.round === maxRound && m.status === "completed",
  );

  return (
    <section className="mb-8">
      <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
        Final Results
      </h3>

      {/* Podium */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* Winner Section */}
        {winner && (
          <div className="border-b border-zinc-200 bg-gradient-to-r from-yellow-50 to-amber-50 p-6 dark:border-zinc-800 dark:from-yellow-900/20 dark:to-amber-900/20">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-2xl font-bold text-yellow-900 dark:bg-yellow-500">
                1
              </div>
              <div>
                <p className="text-xs font-medium tracking-wider text-yellow-700 uppercase dark:text-yellow-400">
                  Champion
                </p>
                <p className="text-xl font-bold text-black dark:text-white">
                  {winner.teamName}
                </p>
              </div>
            </div>
            {finalMatch && (
              <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Final Score: {finalMatch.homeTeamName} {finalMatch.homeScore} -{" "}
                {finalMatch.awayScore} {finalMatch.awayTeamName}
              </div>
            )}
          </div>
        )}

        {/* Runner-up Section */}
        {runnerUp && (
          <div className="border-b border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-300 text-lg font-bold text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200">
                2
              </div>
              <div>
                <p className="text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                  Runner-up
                </p>
                <p className="font-semibold text-black dark:text-white">
                  {runnerUp.teamName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="p-4">
          <h4 className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Competition Stats
          </h4>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatBox label="Groups" value={groupStandings.length.toString()} />
            <StatBox
              label="Teams"
              value={groupStandings
                .reduce((sum, g) => sum + g.standings.length, 0)
                .toString()}
            />
            <StatBox
              label="Knockout Matches"
              value={knockoutMatches.length.toString()}
            />
            <StatBox
              label="Total Matches"
              value={(
                groupStandings.reduce(
                  (sum, g) =>
                    sum + g.standings.reduce((s, t) => s + t.played, 0) / 2,
                  0,
                ) + knockoutMatches.length
              ).toString()}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatBox({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-lg bg-zinc-100 p-3 text-center dark:bg-zinc-800">
      <p className="text-2xl font-bold text-black dark:text-white">{value}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

function getRunnerUp(
  knockoutMatches: KnockoutMatch[],
  groupStandings: GroupStandings[],
  winner: { teamId: string; teamName: string } | null,
): { teamId: string; teamName: string } | null {
  // If there are knockout matches, runner-up is the loser of the final
  if (knockoutMatches.length > 0) {
    const maxRound = Math.max(...knockoutMatches.map((m) => m.round));
    const finalMatch = knockoutMatches.find(
      (m) => m.round === maxRound && m.status === "completed",
    );

    if (finalMatch && finalMatch.winnerId) {
      const loserId =
        finalMatch.winnerId === finalMatch.homeTeamId
          ? finalMatch.awayTeamId
          : finalMatch.homeTeamId;
      const loserName =
        finalMatch.winnerId === finalMatch.homeTeamId
          ? finalMatch.awayTeamName
          : finalMatch.homeTeamName;
      return { teamId: loserId, teamName: loserName };
    }
  }

  // If no knockout, get second place from groups
  if (groupStandings.length > 0 && winner) {
    const allStandings = groupStandings.flatMap((g) => g.standings);
    const sorted = allStandings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.difference !== a.difference) return b.difference - a.difference;
      return b.scored - a.scored;
    });

    // Find the second team that isn't the winner
    const second = sorted.find((t) => t.teamId !== winner.teamId);
    if (second) {
      return { teamId: second.teamId, teamName: second.teamName };
    }
  }

  return null;
}
