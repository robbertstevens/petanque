import Link from "next/link";

import { getActiveCompetitions } from "@/lib/actions/competitions";

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

export default async function StandingsListPage() {
  const competitions = await getActiveCompetitions();

  // Filter to only show competitions that have standings (group_stage, knockout, or completed)
  const competitionsWithStandings = competitions.filter(
    (c) =>
      c.status === "group_stage" ||
      c.status === "knockout" ||
      c.status === "completed",
  );

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Competition Standings
      </h2>

      {competitionsWithStandings.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-600 dark:text-zinc-400">
            No competitions with standings available yet.
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Standings are available once a competition enters the group stage.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {competitionsWithStandings.map((competition) => {
            const status = statusLabels[competition.status] || {
              label: competition.status,
              color: "bg-zinc-100 text-zinc-700",
            };

            return (
              <Link
                key={competition.id}
                href={`/competitions/standings/${competition.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-black dark:text-white">
                      {competition.name}
                    </h3>
                    {competition.description && (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {competition.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-500">
                      <span>{competition.teamCount} teams</span>
                      {competition.startDate && (
                        <span>
                          Started{" "}
                          {new Date(competition.startDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
