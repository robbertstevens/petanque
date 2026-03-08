import Link from "next/link";
import { Trophy, Target, Users, Calendar, Inbox } from "lucide-react";

import { getCompetitionsByStatus } from "@/lib/actions/competitions-user";

export default async function CompetitionsBrowsePage() {
  const competitions = await getCompetitionsByStatus("all-active");

  return (
    <div>
      <h2 className="mb-6 flex items-center gap-2 text-lg font-medium text-black dark:text-white">
        <Trophy className="h-5 w-5" />
        Active Competitions
      </h2>

      {competitions.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Inbox className="mx-auto mb-3 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <p className="text-zinc-600 dark:text-zinc-400">
            No active competitions at the moment.
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Check back later or view the archive for completed competitions.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {competitions.map((competition) => (
            <Link
              key={competition.id}
              href={`/competitions/${competition.id}`}
              className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <h3 className="font-medium text-black dark:text-white">
                {competition.name}
              </h3>
              {competition.description && (
                <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {competition.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {competition.status === "registration" && (
                  <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <Target className="h-3 w-3" />
                    Open for Registration
                  </span>
                )}
                {competition.status === "group_stage" && (
                  <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <Users className="h-3 w-3" />
                    Group Stage
                  </span>
                )}
                {competition.status === "knockout" && (
                  <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    <Trophy className="h-3 w-3" />
                    Knockout Stage
                  </span>
                )}
                <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <Users className="h-3 w-3" />
                  {competition.teamSize} players/team
                </span>
                <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <Users className="h-3 w-3" />
                  {competition.registeredTeamCount} team
                  {competition.registeredTeamCount !== 1 ? "s" : ""} registered
                </span>
              </div>
              {(competition.startDate || competition.endDate) && (
                <div className="mt-3 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-500">
                  <Calendar className="h-3 w-3" />
                  {competition.startDate && (
                    <span>
                      Starts:{" "}
                      {new Date(competition.startDate).toLocaleDateString()}
                    </span>
                  )}
                  {competition.startDate && competition.endDate && (
                    <span className="mx-2">•</span>
                  )}
                  {competition.endDate && (
                    <span>
                      Ends: {new Date(competition.endDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
