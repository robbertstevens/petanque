import { notFound } from "next/navigation";
import Link from "next/link";

import {
  getCompetition,
  getMyTeamsAsCaptain,
  getCompetitionStandings,
  getCompetitionMatches,
} from "@/lib/actions/competitions-user";
import { RegisterTeamForm } from "./register-team-form";
import { CompetitionProgress } from "./competition-progress";
import { ScheduleSection } from "./schedule-section";
import { StandingsSection } from "./standings-section";

type Props = Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}>;

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "teams", label: "Teams" },
  { key: "schedule", label: "Schedule" },
  { key: "standings", label: "Standings" },
] as const;

export default async function CompetitionDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { tab } = await searchParams;
  const currentTab = tab && tabs.some((t) => t.key === tab) ? tab : "overview";

  const [competition, myTeams, standings, matches] = await Promise.all([
    getCompetition(id),
    getMyTeamsAsCaptain(),
    getCompetitionStandings(id),
    getCompetitionMatches(id),
  ]);

  if (!competition) {
    notFound();
  }

  // Filter teams that are eligible for registration
  const eligibleTeams = myTeams.filter(
    (team) =>
      team.memberCount >= competition.teamSize &&
      !team.registeredCompetitionIds.includes(competition.id),
  );

  // Teams that are already registered
  const alreadyRegisteredTeams = myTeams.filter((team) =>
    team.registeredCompetitionIds.includes(competition.id),
  );

  return (
    <div>
      <Link
        href="/competitions"
        className="mb-4 inline-block text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
      >
        ← Back to Browse
      </Link>

      {/* Competition Header */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          {competition.name}
        </h2>
        {competition.description && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {competition.description}
          </p>
        )}

        {/* Progress Indicator */}
        <div className="mt-4">
          <CompetitionProgress status={competition.status} />
        </div>

        <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
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

      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex gap-4">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/competitions/${id}?tab=${t.key}`}
              className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                currentTab === t.key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {currentTab === "overview" && (
          <OverviewTab
            competition={competition}
            eligibleTeams={eligibleTeams}
            alreadyRegisteredTeams={alreadyRegisteredTeams}
          />
        )}

        {currentTab === "teams" && (
          <TeamsTab
            competition={competition}
            eligibleTeams={eligibleTeams}
            alreadyRegisteredTeams={alreadyRegisteredTeams}
            myTeams={myTeams}
          />
        )}

        {currentTab === "schedule" && matches && (
          <ScheduleSection
            upcoming={matches.upcoming}
            completed={matches.completed}
          />
        )}

        {currentTab === "standings" && standings && (
          <StandingsSection
            groupStandings={standings.groupStandings}
            knockoutMatches={standings.knockoutMatches}
            status={standings.status}
          />
        )}

        {currentTab === "standings" && !standings && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-600 dark:text-zinc-400">
              Standings are not available for this competition yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Tab Components
// ============================================================================

type Competition = Awaited<ReturnType<typeof getCompetition>>;
type Team = Awaited<ReturnType<typeof getMyTeamsAsCaptain>>[number];

function OverviewTab({
  competition,
  eligibleTeams,
  alreadyRegisteredTeams,
}: {
  competition: NonNullable<Competition>;
  eligibleTeams: Team[];
  alreadyRegisteredTeams: Team[];
}) {
  return (
    <div className="space-y-8">
      {/* Registration Section */}
      {competition.status === "registration" && (
        <section>
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
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You need to be a captain of a team with at least{" "}
                {competition.teamSize} members to register.
              </p>
              <Link
                href="/teams"
                className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Manage Teams →
              </Link>
            </div>
          )}
        </section>
      )}

      {competition.status !== "registration" && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Registration is closed for this competition.
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <section>
        <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
          Quick Stats
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-2xl font-bold text-black dark:text-white">
              {competition.registeredTeams.length}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Registered Teams
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-2xl font-bold text-black dark:text-white">
              {competition.teamSize}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Players per Team
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-2xl font-bold text-black dark:text-white">
              {competition.registeredTeams.length * competition.teamSize}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Total Players
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function TeamsTab({
  competition,
  eligibleTeams,
  alreadyRegisteredTeams,
  myTeams,
}: {
  competition: NonNullable<Competition>;
  eligibleTeams: Team[];
  alreadyRegisteredTeams: Team[];
  myTeams: Team[];
}) {
  return (
    <div className="space-y-8">
      {/* Registration Section */}
      {competition.status === "registration" && (
        <section>
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

      {/* Registered Teams */}
      <section>
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
