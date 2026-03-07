import Link from "next/link";

import { getCompletedCompetitions } from "@/lib/actions/competitions-user";

export default async function CompetitionArchivePage() {
  const competitions = await getCompletedCompetitions();

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Competition Archive
      </h2>

      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Historical records of completed competitions.
      </p>

      {competitions.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-600 dark:text-zinc-400">
            No completed competitions yet.
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Completed competitions will appear here for historical reference.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {competitions.map((competition) => (
            <Link
              key={competition.id}
              href={`/competitions/${competition.id}?tab=standings`}
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
                    <span>{competition.teamSize}-player teams</span>
                    {competition.startDate && competition.endDate && (
                      <span>
                        {new Date(competition.startDate).toLocaleDateString()} -{" "}
                        {new Date(competition.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Completed
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
