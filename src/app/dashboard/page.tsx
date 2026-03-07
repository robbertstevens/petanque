import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getMyTeams, getMyInvitations } from "@/lib/actions/teams";
import { getMyCompetitions } from "@/lib/actions/competitions-user";
import { isCurrentUserAdmin } from "@/lib/actions/competitions-admin";
import { getUpcomingMatches, getMatchHistory } from "@/lib/actions/matches";

import { SignOutButton } from "./sign-out-button";
import { InvitationsList } from "./invitation-card";

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const [
    teams,
    invitations,
    upcomingMatches,
    matchHistory,
    myCompetitions,
    isAdmin,
  ] = await Promise.all([
    getMyTeams(),
    getMyInvitations(),
    getUpcomingMatches(),
    getMatchHistory(),
    getMyCompetitions(),
    isCurrentUserAdmin(),
  ]);

  // Limit displayed items
  const displayedUpcoming = upcomingMatches.slice(0, 3);
  const displayedHistory = matchHistory.slice(0, 3);
  const activeCompetitions = myCompetitions.filter(
    (c) =>
      c.competitionStatus === "group_stage" ||
      c.competitionStatus === "knockout",
  );

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              Dashboard
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Welcome back,{" "}
              {session.user.username ?? session.user.name ?? session.user.email}
            </p>
          </div>
          <SignOutButton />
        </header>

        {/* Pending Invitations */}
        <div className="mb-8">
          <InvitationsList
            invitations={invitations.map((inv) => ({
              id: inv.id,
              team: { id: inv.team.id, name: inv.team.name },
              invitedByUser: inv.invitedByUser,
            }))}
          />
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Upcoming Matches */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-black dark:text-white">
                  Upcoming Matches
                </h2>
                {upcomingMatches.length > 3 && (
                  <Link
                    href="/matches"
                    className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    View all
                  </Link>
                )}
              </div>
              {displayedUpcoming.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-zinc-500 dark:text-zinc-400">
                    No upcoming matches
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedUpcoming.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              )}
            </section>

            {/* My Teams */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-black dark:text-white">
                  My Teams
                </h2>
                <Link
                  href="/teams"
                  className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Manage teams
                </Link>
              </div>
              {teams.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-zinc-500 dark:text-zinc-400">
                    You are not a member of any teams yet.
                  </p>
                  <Link
                    href="/teams"
                    className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Create or join a team
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {teams.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      isCaptain={team.isCaptain}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Active Competitions */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-black dark:text-white">
                  Active Competitions
                </h2>
                <Link
                  href="/competitions/my"
                  className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  View all
                </Link>
              </div>
              {activeCompetitions.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-zinc-500 dark:text-zinc-400">
                    No active competitions
                  </p>
                  <Link
                    href="/competitions"
                    className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Browse competitions
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCompetitions.map((comp) => (
                    <CompetitionCard
                      key={comp.registrationId}
                      competition={comp}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Recent Results */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-black dark:text-white">
                  Recent Results
                </h2>
                {matchHistory.length > 3 && (
                  <Link
                    href="/matches"
                    className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    View all
                  </Link>
                )}
              </div>
              {displayedHistory.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-zinc-500 dark:text-zinc-400">
                    No completed matches yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedHistory.map((match) => (
                    <ResultCard key={match.id} match={match} />
                  ))}
                </div>
              )}
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="mb-4 text-lg font-medium text-black dark:text-white">
                Quick Actions
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/competitions"
                  className="flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-3 font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                >
                  Browse Competitions
                </Link>
                <Link
                  href="/teams"
                  className="flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-3 font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                >
                  Manage Teams
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center justify-center rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 font-medium text-purple-700 transition-colors hover:bg-purple-100 sm:col-span-2 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-400 dark:hover:bg-purple-900/30"
                  >
                    Admin Panel
                  </Link>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

type MatchData = Awaited<ReturnType<typeof getUpcomingMatches>>[number];

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
        <div className="flex-1">
          <span
            className={
              match.isMyTeamHome
                ? "font-semibold text-black dark:text-white"
                : "text-zinc-600 dark:text-zinc-400"
            }
          >
            {match.homeTeam.name}
          </span>
        </div>
        <span className="px-3 text-zinc-400">vs</span>
        <div className="flex-1 text-right">
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
      </div>
      <p className="mt-2 text-xs text-zinc-500">{match.competition.name}</p>
    </Link>
  );
}

function ResultCard({ match }: Readonly<{ match: MatchData }>) {
  const homeWon = match.score && match.score.homeScore > match.score.awayScore;
  const awayWon = match.score && match.score.awayScore > match.score.homeScore;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <span
            className={
              homeWon
                ? "font-semibold text-green-600 dark:text-green-400"
                : "text-zinc-600 dark:text-zinc-400"
            }
          >
            {match.homeTeam.name}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 text-lg font-bold">
          <span
            className={
              homeWon
                ? "text-green-600 dark:text-green-400"
                : "text-black dark:text-white"
            }
          >
            {match.score?.homeScore ?? "-"}
          </span>
          <span className="text-zinc-400">-</span>
          <span
            className={
              awayWon
                ? "text-green-600 dark:text-green-400"
                : "text-black dark:text-white"
            }
          >
            {match.score?.awayScore ?? "-"}
          </span>
        </div>
        <div className="flex-1 text-right">
          <span
            className={
              awayWon
                ? "font-semibold text-green-600 dark:text-green-400"
                : "text-zinc-600 dark:text-zinc-400"
            }
          >
            {match.awayTeam.name}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-500">{match.competition.name}</p>
    </Link>
  );
}

type TeamData = Awaited<ReturnType<typeof getMyTeams>>[number];

function TeamCard({
  team,
  isCaptain,
}: Readonly<{ team: TeamData; isCaptain: boolean }>) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-black dark:text-white">
              {team.name}
            </span>
            {isCaptain && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Captain
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
      </div>
    </Link>
  );
}

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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-black dark:text-white">
              {competition.competitionName}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[competition.competitionStatus] ?? statusStyles.registration}`}
            >
              {competition.competitionStatus.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Playing as {competition.teamName}
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
      </div>
    </Link>
  );
}
