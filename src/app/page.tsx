import Link from "next/link";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  getCompetitionsByStatus,
  getMyCompetitions,
} from "@/lib/actions/competitions-user";
import { getMyTeams } from "@/lib/actions/teams";
import { getUpcomingMatches } from "@/lib/actions/matches";

import { LoginForm } from "@/components/auth/login-form";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Fetch data based on auth state
  const competitions = await getCompetitionsByStatus("all-active");

  let myCompetitions: Awaited<ReturnType<typeof getMyCompetitions>> = [];
  let upcomingMatches: MatchData[] = [];
  let myTeams: Awaited<ReturnType<typeof getMyTeams>> = [];

  if (session?.user) {
    const allMyCompetitions = await getMyCompetitions();
    myCompetitions = allMyCompetitions.filter(
      (c) =>
        c.competitionStatus === "group_stage" ||
        c.competitionStatus === "knockout",
    );
    upcomingMatches = (await getUpcomingMatches()).slice(0, 5);
    myTeams = (await getMyTeams()).slice(0, 5);
  }

  const displayCompetitions = competitions.slice(0, 6);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Hero Section */}
      <section className="border-b border-zinc-200 bg-white px-4 py-12 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-4 text-3xl font-bold text-black dark:text-white">
            Pétanque Competition Management
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Discover active competitions, register your team, and track your
            progress. Join the community of pétanque players competing in
            organized tournaments.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {session?.user ? (
          /* Logged In View - Dashboard Grid */
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content - Active Competitions */}
            <div className="space-y-8 lg:col-span-2">
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-black dark:text-white">
                    My Active Competitions
                  </h2>
                  <Link
                    href="/competitions/my"
                    className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    View all
                  </Link>
                </div>

                {myCompetitions.length === 0 ? (
                  <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-zinc-600 dark:text-zinc-400">
                      You are not registered in any active competitions.
                    </p>
                    <Link
                      href="/competitions"
                      className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Browse competitions
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {myCompetitions.map((comp) => (
                      <CompetitionCard
                        key={comp.registrationId}
                        competition={comp}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Upcoming Matches */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-black dark:text-white">
                    Upcoming Matches
                  </h2>
                  <Link
                    href="/matches"
                    className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    View all
                  </Link>
                </div>

                {upcomingMatches.length === 0 ? (
                  <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-zinc-500 dark:text-zinc-400">
                      No upcoming matches scheduled.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </section>

              {/* Public Competitions Section */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-black dark:text-white">
                    All Active Competitions
                  </h2>
                  <Link
                    href="/competitions"
                    className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    Browse all
                  </Link>
                </div>

                {competitions.length === 0 ? (
                  <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-zinc-600 dark:text-zinc-400">
                      No active competitions at the moment.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {displayCompetitions.map((competition) => (
                      <PublicCompetitionCard
                        key={competition.id}
                        competition={competition}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar - Quick Actions & Teams */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <Link
                    href="/competitions"
                    className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                  >
                    Browse Competitions
                  </Link>
                  <Link
                    href="/teams"
                    className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                  >
                    Manage Teams
                  </Link>
                </div>
              </section>

              {/* My Teams */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-black dark:text-white">
                    My Teams
                  </h2>
                  <Link
                    href="/teams"
                    className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    View all
                  </Link>
                </div>

                {myTeams.length === 0 ? (
                  <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No teams yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTeams.map((team) => (
                      <TeamCard key={team.id} team={team} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        ) : (
          /* Not Logged In View - Landing Page */
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content - Active Competitions */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  Active Competitions
                </h2>
                <Link
                  href="/competitions"
                  className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  View all
                </Link>
              </div>

              {competitions.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    No active competitions at the moment.
                  </p>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
                    Check back later or view the archive for completed
                    competitions.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {displayCompetitions.map((competition) => (
                    <PublicCompetitionCard
                      key={competition.id}
                      competition={competition}
                    />
                  ))}
                </div>
              )}

              {/* Archive Link */}
              <div className="mt-8">
                <Link
                  href="/competitions/archive"
                  className="inline-flex items-center text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
                >
                  <span>View competition archive</span>
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Sidebar - Sign In */}
            <div>
              <LoginForm />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

type CompetitionData = Awaited<ReturnType<typeof getMyCompetitions>>[number];

function CompetitionCard({
  competition,
}: Readonly<{ competition: CompetitionData }>) {
  const statusStyles: Record<string, string> = {
    registration:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    group_stage:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    knockout:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    completed: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };

  return (
    <Link
      href={`/competitions/${competition.competitionId}?tab=standings`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-black dark:text-white">
            {competition.competitionName}
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Playing as {competition.teamName}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[competition.competitionStatus] ?? statusStyles.registration}`}
        >
          {competition.competitionStatus.replace("_", " ")}
        </span>
      </div>
    </Link>
  );
}

type PublicCompetition = Awaited<
  ReturnType<typeof getCompetitionsByStatus>
>[number];

function PublicCompetitionCard({
  competition,
}: Readonly<{ competition: PublicCompetition }>) {
  const statusStyles: Record<string, string> = {
    registration:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    group_stage:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    knockout:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    completed: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };

  return (
    <Link
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
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[competition.status] ?? statusStyles.registration}`}
        >
          {competition.status.replace("_", " ")}
        </span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {competition.teamSize} players/team
        </span>
      </div>
      <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
        {competition.registeredTeamCount} team
        {competition.registeredTeamCount !== 1 ? "s" : ""} registered
      </div>
    </Link>
  );
}

type MatchData = {
  id: string;
  round: number;
  isKnockout: boolean;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduledAt: Date | null;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  competition: { id: string; name: string; status: string };
  group: { id: string; name: string } | null;
  score: { homeScore: number; awayScore: number } | null;
  myTeamId: string | undefined;
  isMyTeamHome: boolean;
  canSubmitScore: boolean;
  isCaptain: boolean;
};

function MatchCard({ match }: Readonly<{ match: MatchData }>) {
  const statusStyles: Record<string, string> = {
    scheduled: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    in_progress:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`rounded-full px-2 py-0.5 font-medium ${statusStyles[match.status] ?? statusStyles.scheduled}`}
        >
          {match.status.replace("_", " ")}
        </span>
        {match.isKnockout && (
          <span className="rounded-full bg-purple-100 px-2 py-0.5 font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            Knockout
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span
          className={
            match.isMyTeamHome
              ? "font-semibold text-black dark:text-white"
              : "text-zinc-600 dark:text-zinc-400"
          }
        >
          {match.homeTeam.name}
        </span>
        <span className="px-2 text-zinc-400">vs</span>
        <span
          className={
            !match.isMyTeamHome
              ? "font-semibold text-black dark:text-white"
              : "text-zinc-600 dark:text-zinc-400"
          }
        >
          {match.awayTeam.name}
        </span>
      </div>
    </Link>
  );
}

type TeamData = Awaited<ReturnType<typeof getMyTeams>>[number];

function TeamCard({ team }: Readonly<{ team: TeamData }>) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <div>
        <span className="font-medium text-black dark:text-white">
          {team.name}
        </span>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {team.members.length} member{team.members.length !== 1 ? "s" : ""}
        </p>
      </div>
      <svg
        className="h-5 w-5 text-zinc-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
}
