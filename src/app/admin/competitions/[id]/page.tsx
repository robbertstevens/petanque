import { notFound } from "next/navigation";
import Link from "next/link";

import { getCompetition } from "@/lib/actions/competitions";
import { StatusManager } from "./status-manager";
import { GroupsManager } from "./groups-manager";
import { TeamsManager } from "./teams-manager";
import { MatchesManager } from "./matches-manager";
import { CompetitionActions } from "./competition-actions";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CompetitionDetailPage({ params }: Props) {
  const { id } = await params;
  const competition = await getCompetition(id);

  if (!competition) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/admin/competitions"
          className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
        >
          &larr; Back to Competitions
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-black dark:text-white">
              {competition.name}
            </h2>
            {competition.description && (
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {competition.description}
              </p>
            )}
          </div>
          <StatusManager
            competitionId={competition.id}
            currentStatus={competition.status}
          />
        </div>
      </div>

      {/* Competition Info */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Team Size</p>
          <p className="text-lg font-medium text-black dark:text-white">
            {competition.teamSize} players
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Registered Teams
          </p>
          <p className="text-lg font-medium text-black dark:text-white">
            {competition.competitionTeams.length}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Groups</p>
          <p className="text-lg font-medium text-black dark:text-white">
            {competition.groups.length}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Matches</p>
          <p className="text-lg font-medium text-black dark:text-white">
            {competition.matches.length}
          </p>
        </div>
      </div>

      {/* Groups Section */}
      <section className="mb-8">
        <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
          Groups
        </h3>
        <GroupsManager
          competitionId={competition.id}
          groups={competition.groups}
          status={competition.status}
        />
      </section>

      {/* Teams Section */}
      <section className="mb-8">
        <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
          Registered Teams
        </h3>
        <TeamsManager
          competitionId={competition.id}
          teams={competition.competitionTeams}
          groups={competition.groups}
          status={competition.status}
        />
      </section>

      {/* Matches Section */}
      <section className="mb-8">
        <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
          Matches
        </h3>
        <MatchesManager
          competitionId={competition.id}
          groups={competition.groups}
          matches={competition.matches}
          status={competition.status}
        />
      </section>

      {/* Actions Section */}
      <section>
        <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
          Actions
        </h3>
        <CompetitionActions
          competitionId={competition.id}
          status={competition.status}
        />
      </section>
    </main>
  );
}
