import { notFound } from "next/navigation";
import Link from "next/link";

import {
  getCompetitionForUser,
  getMyTeamsAsCaptain,
} from "@/lib/actions/competitions";
import { RegisterTeamForm } from "./register-team-form";

type Props = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function CompetitionDetailPage({ params }: Props) {
  const { id } = await params;
  const [competition, myTeams] = await Promise.all([
    getCompetitionForUser(id),
    getMyTeamsAsCaptain(),
  ]);

  if (!competition) {
    notFound();
  }

  // Filter teams that are eligible for registration:
  // - User is captain (already filtered by getMyTeamsAsCaptain)
  // - Has enough members
  // - Not already registered
  const eligibleTeams = myTeams.filter(
    (team) =>
      team.memberCount >= competition.teamSize &&
      !team.registeredCompetitionIds.includes(competition.id),
  );

  // Teams that are already registered
  const alreadyRegisteredTeams = myTeams.filter((team) =>
    team.registeredCompetitionIds.includes(competition.id),
  );

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: "Draft", color: "bg-zinc-100 text-zinc-700" },
    registration: {
      label: "Open for Registration",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    group_stage: {
      label: "Group Stage",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    knockout: {
      label: "Knockout Stage",
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    completed: {
      label: "Completed",
      color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    },
  };

  const status = statusLabels[competition.status] || {
    label: competition.status,
    color: "bg-zinc-100 text-zinc-700",
  };

  return (
    <div>
      <Link
        href="/competitions"
        className="mb-4 inline-block text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
      >
        ← Back to Browse
      </Link>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            {competition.name}
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}
          >
            {status.label}
          </span>
        </div>

        {competition.description && (
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            {competition.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <div>
            <span className="font-medium text-black dark:text-white">
              Team Size:
            </span>{" "}
            {competition.teamSize} players
          </div>
          {competition.startDate && (
            <div>
              <span className="font-medium text-black dark:text-white">
                Starts:
              </span>{" "}
              {new Date(competition.startDate).toLocaleDateString()}
            </div>
          )}
          {competition.endDate && (
            <div>
              <span className="font-medium text-black dark:text-white">
                Ends:
              </span>{" "}
              {new Date(competition.endDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Registration Section */}
      {competition.status === "registration" && (
        <section className="mt-8">
          <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
            Register Your Team
          </h3>

          {alreadyRegisteredTeams.length > 0 && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                Your registered teams:
              </p>
              <ul className="mt-1 text-sm text-green-700 dark:text-green-400/80">
                {alreadyRegisteredTeams.map((team) => (
                  <li key={team.id}>• {team.name}</li>
                ))}
              </ul>
            </div>
          )}

          {eligibleTeams.length > 0 ? (
            <RegisterTeamForm
              competitionId={competition.id}
              teams={eligibleTeams}
            />
          ) : myTeams.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You are not a captain of any teams.{" "}
                <Link
                  href="/teams"
                  className="text-black underline hover:no-underline dark:text-white"
                >
                  Create a team
                </Link>{" "}
                to register for this competition.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No eligible teams available. Teams need at least{" "}
                {competition.teamSize} members and must not already be
                registered.
              </p>
            </div>
          )}
        </section>
      )}

      {competition.status !== "registration" && (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Registration is closed for this competition.
          </p>
        </div>
      )}

      {/* Registered Teams */}
      <section className="mt-8">
        <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
          Registered Teams ({competition.registeredTeams.length})
        </h3>

        {competition.registeredTeams.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No teams have registered yet.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {competition.registeredTeams.map((registration) => (
                <li
                  key={registration.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="font-medium text-black dark:text-white">
                    {registration.teamName}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    Registered{" "}
                    {new Date(registration.registeredAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
