import type { GroupStandings } from "@/lib/actions/competitions";
import { GroupStandingsTable } from "../standings/[id]/group-standings-table";
import { KnockoutBracket } from "../standings/[id]/knockout-bracket";

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
  groupStandings: GroupStandings[];
  knockoutMatches: KnockoutMatch[];
  status: string;
}>;

export function StandingsSection({
  groupStandings,
  knockoutMatches,
  status,
}: Props) {
  // Find the winner if competition is completed
  const winner =
    status === "completed" ? getWinner(groupStandings, knockoutMatches) : null;

  return (
    <div className="space-y-8">
      {/* Winner Banner */}
      {winner && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
            Winner
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-300">
            {winner}
          </p>
        </div>
      )}

      {/* Group Standings */}
      {groupStandings.length > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
            Group Standings
          </h3>
          <div className="space-y-6">
            {groupStandings.map((group) => (
              <GroupStandingsTable key={group.groupId} group={group} />
            ))}
          </div>
        </section>
      )}

      {/* Knockout Bracket */}
      {knockoutMatches.length > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
            Knockout Bracket
          </h3>
          <KnockoutBracket matches={knockoutMatches} />
        </section>
      )}

      {/* Empty State */}
      {groupStandings.length === 0 && knockoutMatches.length === 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-600 dark:text-zinc-400">
            No standings data available yet.
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Teams need to be assigned to groups and matches need to be played.
          </p>
        </div>
      )}
    </div>
  );
}

function getWinner(
  groupStandings: GroupStandings[],
  knockoutMatches: KnockoutMatch[],
): string | null {
  // If there are knockout matches, find the final winner
  if (knockoutMatches.length > 0) {
    const maxRound = Math.max(...knockoutMatches.map((m) => m.round));
    const finalMatch = knockoutMatches.find(
      (m) => m.round === maxRound && m.status === "completed",
    );

    if (finalMatch && finalMatch.winnerId) {
      return finalMatch.winnerId === finalMatch.homeTeamId
        ? finalMatch.homeTeamName
        : finalMatch.awayTeamName;
    }
  }

  // If no knockout winner, use the top team from group standings
  if (groupStandings.length > 0) {
    const allStandings = groupStandings.flatMap((g) => g.standings);
    if (allStandings.length > 0) {
      const sorted = allStandings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.difference !== a.difference) return b.difference - a.difference;
        return b.scored - a.scored;
      });
      return sorted[0].teamName;
    }
  }

  return null;
}
