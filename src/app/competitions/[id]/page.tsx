import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  getPublicCompetition,
  getMyTeamsAsCaptain,
  getPublicCompetitionStandings,
  getPublicCompetitionMatches,
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
  const currentTab = tab && tabs.some((t) => t.key === tab) ? tab : "teams";

  // Check auth status
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAuthenticated = !!session;

  // Fetch public data and authenticated data in parallel
  const [competition, standings, matches, myTeams] = await Promise.all([
    getPublicCompetition(id),
    getPublicCompetitionStandings(id),
    getPublicCompetitionMatches(id),
    isAuthenticated ? getMyTeamsAsCaptain() : Promise.resolve([]),
  ]);

  if (!competition) {
    notFound();
  }

  // Type guard - after notFound(), competition is guaranteed to be non-null
  const comp = competition;

  // Filter teams that are eligible for registration
  const eligibleTeams = myTeams.filter(
    (team) =>
      team.memberCount >= comp.teamSize &&
      !team.registeredCompetitionIds.includes(comp.id),
  );

  // Teams that are already registered
  const alreadyRegisteredTeams = myTeams.filter((team) =>
    team.registeredCompetitionIds.includes(comp.id),
  );

  return (
    <div>
      <Link
        href="/competitions"
        className="text-muted hover:text-primary mb-4 inline-block text-sm"
      >
        ← Back to Browse
      </Link>

      {/* Competition Header */}
      <div className="border-primary-light bg-surface mb-6 rounded-lg border p-6">
        <h2 className="text-foreground text-xl font-semibold">{comp.name}</h2>
        {comp.description && (
          <p className="text-muted mt-2">{comp.description}</p>
        )}

        {/* Progress Indicator */}
        <div className="mt-4">
          <CompetitionProgress status={comp.status} />
        </div>

        <div className="text-muted mt-2 flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-foreground font-medium">Team Size:</span>{" "}
            {comp.teamSize} players
          </div>
          {competition.startDate && (
            <div>
              <span className="text-foreground font-medium">Starts:</span>{" "}
              {new Date(competition.startDate).toLocaleDateString()}
            </div>
          )}
          {competition.endDate && (
            <div>
              <span className="text-foreground font-medium">Ends:</span>{" "}
              {new Date(competition.endDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-primary-light mb-6 border-b">
        <nav className="-mb-px flex gap-4">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/competitions/${id}?tab=${t.key}`}
              className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                currentTab === t.key
                  ? "border-primary text-primary"
                  : "text-muted hover:border-primary-light hover:text-foreground border-transparent"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {currentTab === "teams" && (
          <TeamsTab
            competition={competition}
            eligibleTeams={eligibleTeams}
            alreadyRegisteredTeams={alreadyRegisteredTeams}
            myTeams={myTeams}
            isAuthenticated={isAuthenticated}
          />
        )}

        {currentTab === "schedule" && matches && (
          <ScheduleSection
            upcoming={matches.upcoming}
            completed={matches.completed}
            isAuthenticated={isAuthenticated}
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
          <div className="border-primary-light bg-surface rounded-lg border p-8 text-center">
            <p className="text-foreground">
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

type Competition = Awaited<ReturnType<typeof getPublicCompetition>>;
type Team = Awaited<ReturnType<typeof getMyTeamsAsCaptain>>[number];

function TeamsTab({
  competition,
  eligibleTeams,
  alreadyRegisteredTeams,
  myTeams,
  isAuthenticated,
}: {
  competition: NonNullable<Competition>;
  eligibleTeams: Team[];
  alreadyRegisteredTeams: Team[];
  myTeams: Team[];
  isAuthenticated: boolean;
}) {
  return (
    <div className="space-y-8">
      {/* Registration Section */}
      {competition.status === "registration" && (
        <section>
          <h3 className="text-foreground mb-4 text-lg font-medium">
            Register Your Team
          </h3>

          {isAuthenticated ? (
            <>
              {alreadyRegisteredTeams.length > 0 && (
                <div
                  className="mb-4 rounded-lg border p-4"
                  style={{
                    borderColor: "var(--badge-group-bg)",
                    backgroundColor:
                      "color-mix(in oklab, var(--badge-group-bg) 10%, transparent)",
                  }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--badge-group-bg)" }}
                  >
                    Your registered teams:
                  </p>
                  <ul
                    className="mt-1 text-sm"
                    style={{ color: "var(--badge-group-bg)" }}
                  >
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
                <div className="border-primary-light bg-surface rounded-lg border p-4">
                  <p className="text-muted text-sm">
                    You are not a captain of any teams.{" "}
                    <Link
                      href="/teams"
                      className="text-foreground underline hover:no-underline"
                    >
                      Create a team
                    </Link>{" "}
                    to register for this competition.
                  </p>
                </div>
              ) : (
                <div className="border-primary-light bg-surface rounded-lg border p-4">
                  <p className="text-muted text-sm">
                    No eligible teams available. Teams need at least{" "}
                    {competition.teamSize} members and must not already be
                    registered.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="border-primary-light bg-surface rounded-lg border p-4">
              <p className="text-muted text-sm">
                Sign in to register your team for this competition.
              </p>
              <Link
                href="/"
                className="text-primary hover:text-primary/80 mt-2 inline-block text-sm font-medium"
              >
                Sign In →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Registered Teams */}
      <section>
        <h3 className="text-foreground mb-4 text-lg font-medium">
          Registered Teams ({competition.registeredTeams.length})
        </h3>

        {competition.registeredTeams.length === 0 ? (
          <div className="border-primary-light bg-surface rounded-lg border p-4">
            <p className="text-muted text-sm">No teams have registered yet.</p>
          </div>
        ) : (
          <div className="border-primary-light bg-surface rounded-lg border">
            <ul className="divide-primary-light divide-y">
              {competition.registeredTeams.map((registration) => (
                <li
                  key={registration.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-foreground font-medium">
                    {registration.teamName}
                  </span>
                  <span className="text-muted text-xs">
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
