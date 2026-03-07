import { notFound } from "next/navigation";
import Link from "next/link";

import { getCompetitionStandings } from "@/lib/actions/competitions";
import { GroupStandingsTable } from "./group-standings-table";
import { KnockoutBracket } from "./knockout-bracket";
import { CompetitionResults } from "./competition-results";

type Props = Readonly<{
  params: Promise<{ id: string }>;
}>;

const statusLabels: Record<string, { label: string; color: string }> = {
  registration: {
    label: "Registration",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  group_stage: {
    label: "Group Stage",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  knockout: {
    label: "Knockout",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  completed: {
    label: "Completed",
    color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
};

export default async function CompetitionStandingsPage({ params }: Props) {
  const { id } = await params;
  const standings = await getCompetitionStandings(id);

  if (!standings) {
    notFound();
  }

  const status = statusLabels[standings.status] || {
    label: standings.status,
    color: "bg-zinc-100 text-zinc-700",
  };

  // Find the winner if competition is completed
  const winner = standings.status === "completed" ? getWinner(standings) : null;

  return (
    <div>
      <Link
        href="/competitions/standings"
        className="mb-4 inline-block text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
      >
        ← Back to Standings
      </Link>

      {/* Competition Header */}
      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-black dark:text-white">
              {standings.name}
            </h2>
            {standings.description && (
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {standings.description}
              </p>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}
          >
            {status.label}
          </span>
        </div>
        {(standings.startDate || standings.endDate) && (
          <div className="mt-3 flex gap-4 text-sm text-zinc-500 dark:text-zinc-500">
            {standings.startDate && (
              <span>
                Started: {new Date(standings.startDate).toLocaleDateString()}
              </span>
            )}
            {standings.endDate && (
              <span>
                {standings.status === "completed" ? "Ended" : "Ends"}:{" "}
                {new Date(standings.endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Competition Results (for completed) */}
      {standings.status === "completed" && (
        <CompetitionResults
          winner={winner}
          groupStandings={standings.groupStandings}
          knockoutMatches={standings.knockoutMatches}
        />
      )}

      {/* Group Standings */}
      {standings.groupStandings.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
            Group Standings
          </h3>
          <div className="space-y-6">
            {standings.groupStandings.map((group) => (
              <GroupStandingsTable key={group.groupId} group={group} />
            ))}
          </div>
        </section>
      )}

      {/* Knockout Bracket */}
      {standings.knockoutMatches.length > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
            Knockout Bracket
          </h3>
          <KnockoutBracket matches={standings.knockoutMatches} />
        </section>
      )}

      {/* Empty State */}
      {standings.groupStandings.length === 0 &&
        standings.knockoutMatches.length === 0 && (
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

// Helper to determine winner from knockout matches or group standings
function getWinner(
  standings: Awaited<ReturnType<typeof getCompetitionStandings>>,
) {
  if (!standings) return null;

  // If there are knockout matches, find the final winner
  if (standings.knockoutMatches.length > 0) {
    // Find the highest round (final)
    const maxRound = Math.max(...standings.knockoutMatches.map((m) => m.round));
    const finalMatch = standings.knockoutMatches.find(
      (m) => m.round === maxRound && m.status === "completed",
    );

    if (finalMatch && finalMatch.winnerId) {
      const winnerName =
        finalMatch.winnerId === finalMatch.homeTeamId
          ? finalMatch.homeTeamName
          : finalMatch.awayTeamName;
      return { teamId: finalMatch.winnerId, teamName: winnerName };
    }
  }

  // If no knockout winner, use the top team from group standings
  if (standings.groupStandings.length > 0) {
    // Combine all group standings and find overall leader
    const allStandings = standings.groupStandings.flatMap((g) => g.standings);
    if (allStandings.length > 0) {
      // Sort by points, then difference, then scored
      const sorted = allStandings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.difference !== a.difference) return b.difference - a.difference;
        return b.scored - a.scored;
      });
      return { teamId: sorted[0].teamId, teamName: sorted[0].teamName };
    }
  }

  return null;
}
