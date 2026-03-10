import Link from "next/link";
import { headers } from "next/headers";
import {
  Trophy,
  Users,
  Clock,
  ChevronRight,
  Inbox,
  Target,
  CheckCircle2,
  XCircle,
} from "lucide-react";

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
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="border-primary-light bg-surface border-b px-4 py-12 dark:bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="font-display text-foreground mb-4 text-3xl font-bold">
            Pétanque Competition Management
          </h1>
          <p className="text-muted max-w-2xl text-lg">
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
                  <h2 className="font-display text-foreground text-xl font-semibold">
                    My Active Competitions
                  </h2>
                  <Link
                    href="/competitions/my"
                    className="text-muted hover:text-primary text-sm"
                  >
                    View all
                  </Link>
                </div>

                {myCompetitions.length === 0 ? (
                  <div className="border-primary-light bg-surface rounded-lg border p-8 text-center">
                    <Inbox className="text-muted mx-auto mb-3 h-12 w-12" />
                    <p className="text-foreground">
                      You are not registered in any active competitions.
                    </p>
                    <Link
                      href="/competitions"
                      className="text-primary hover:text-primary/80 mt-2 inline-block text-sm font-medium"
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
                  <h2 className="font-display text-foreground text-xl font-semibold">
                    Upcoming Matches
                  </h2>
                  <Link
                    href="/matches"
                    className="text-muted hover:text-primary text-sm"
                  >
                    View all
                  </Link>
                </div>

                {upcomingMatches.length === 0 ? (
                  <div className="border-primary-light bg-surface rounded-lg border p-6 text-center">
                    <Clock className="text-muted mx-auto mb-2 h-8 w-8" />
                    <p className="text-muted">No upcoming matches scheduled.</p>
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
                  <h2 className="font-display text-foreground text-xl font-semibold">
                    All Active Competitions
                  </h2>
                  <Link
                    href="/competitions"
                    className="text-muted hover:text-primary text-sm"
                  >
                    Browse all
                  </Link>
                </div>

                {competitions.length === 0 ? (
                  <div className="border-primary-light bg-surface rounded-lg border p-8 text-center">
                    <Trophy className="text-muted mx-auto mb-3 h-12 w-12" />
                    <p className="text-foreground">
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
                <h2 className="font-display text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Target className="text-primary h-5 w-5" />
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <Link
                    href="/competitions"
                    className="border-primary-light bg-surface text-foreground hover:border-primary hover:bg-primary-light flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-center font-medium transition-colors"
                  >
                    <Trophy className="text-primary h-4 w-4" />
                    Browse Competitions
                  </Link>
                  <Link
                    href="/teams"
                    className="border-primary-light bg-surface text-foreground hover:border-primary hover:bg-primary-light flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-center font-medium transition-colors"
                  >
                    <Users className="text-accent h-4 w-4" />
                    Manage Teams
                  </Link>
                </div>
              </section>

              {/* My Teams */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-foreground text-lg font-semibold">
                    My Teams
                  </h2>
                  <Link
                    href="/teams"
                    className="text-muted hover:text-primary text-sm"
                  >
                    View all
                  </Link>
                </div>

                {myTeams.length === 0 ? (
                  <div className="border-primary-light bg-surface rounded-lg border p-6 text-center">
                    <Users className="text-muted mx-auto mb-2 h-8 w-8" />
                    <p className="text-muted text-sm">No teams yet.</p>
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
                <h2 className="font-display text-foreground text-xl font-semibold">
                  Active Competitions
                </h2>
                <Link
                  href="/competitions"
                  className="text-muted hover:text-primary text-sm"
                >
                  View all
                </Link>
              </div>

              {competitions.length === 0 ? (
                <div className="border-primary-light bg-surface rounded-lg border p-8 text-center">
                  <Trophy className="text-muted mx-auto mb-3 h-12 w-12" />
                  <p className="text-foreground">
                    No active competitions at the moment.
                  </p>
                  <p className="text-muted mt-2 text-sm">
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
                  className="text-muted hover:text-primary inline-flex items-center text-sm"
                >
                  <span>View competition archive</span>
                  <ChevronRight className="ml-1 h-4 w-4" />
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
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "registration":
        return {
          backgroundColor: "var(--badge-registration-bg)",
          color: "var(--badge-registration-text)",
        };
      case "group_stage":
        return {
          backgroundColor: "var(--badge-group-bg)",
          color: "var(--badge-group-text)",
        };
      case "knockout":
        return {
          backgroundColor: "var(--badge-knockout-bg)",
          color: "var(--badge-knockout-text)",
        };
      case "completed":
        return {
          backgroundColor: "var(--badge-completed-bg)",
          color: "var(--badge-completed-text)",
        };
      default:
        return {
          backgroundColor: "var(--badge-registration-bg)",
          color: "var(--badge-registration-text)",
        };
    }
  };

  const statusIcons: Record<string, React.ReactNode> = {
    registration: <Target className="h-3 w-3" />,
    group_stage: <Users className="h-3 w-3" />,
    knockout: <Trophy className="h-3 w-3" />,
    completed: <ChevronRight className="h-3 w-3" />,
  };

  return (
    <Link
      href={`/competitions/${competition.competitionId}?tab=standings`}
      className="border-primary-light bg-surface hover:border-primary hover:bg-primary-light block rounded-lg border p-4 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-foreground font-medium">
            {competition.competitionName}
          </h3>
          <p className="text-muted mt-1 text-sm">
            Playing as {competition.teamName}
          </p>
        </div>
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={getStatusStyle(competition.competitionStatus)}
        >
          {statusIcons[competition.competitionStatus]}
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
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "registration":
        return {
          backgroundColor: "var(--badge-registration-bg)",
          color: "var(--badge-registration-text)",
        };
      case "group_stage":
        return {
          backgroundColor: "var(--badge-group-bg)",
          color: "var(--badge-group-text)",
        };
      case "knockout":
        return {
          backgroundColor: "var(--badge-knockout-bg)",
          color: "var(--badge-knockout-text)",
        };
      case "completed":
        return {
          backgroundColor: "var(--badge-completed-bg)",
          color: "var(--badge-completed-text)",
        };
      default:
        return {
          backgroundColor: "var(--badge-registration-bg)",
          color: "var(--badge-registration-text)",
        };
    }
  };

  const statusIcons: Record<string, React.ReactNode> = {
    registration: <Target className="h-3 w-3" />,
    group_stage: <Users className="h-3 w-3" />,
    knockout: <Trophy className="h-3 w-3" />,
    completed: <ChevronRight className="h-3 w-3" />,
  };

  return (
    <Link
      href={`/competitions/${competition.id}`}
      className="border-primary-light bg-surface hover:border-primary hover:bg-primary-light block rounded-lg border p-4 transition-colors"
    >
      <h3 className="text-foreground font-medium">{competition.name}</h3>
      {competition.description && (
        <p className="text-muted mt-1 line-clamp-2 text-sm">
          {competition.description}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={getStatusStyle(competition.status)}
        >
          {statusIcons[competition.status]}
          {competition.status.replace("_", " ")}
        </span>
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: "var(--badge-scheduled-bg)",
            color: "var(--badge-scheduled-text)",
          }}
        >
          <Users className="h-3 w-3" />
          {competition.teamSize} players/team
        </span>
      </div>
      <div className="text-muted mt-2 flex items-center gap-1 text-xs">
        <Users className="text-accent h-3 w-3" />
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
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  competition: { id: string; name: string; status: string };
  group: { id: string; name: string } | null;
  score: { homeScore: number; awayScore: number } | null;
  myTeamId: string | undefined;
  isMyTeamHome: boolean;
  canSubmitScore: boolean;
  isCaptain: boolean;
};

function MatchCard({ match }: Readonly<{ match: MatchData }>) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "scheduled":
        return {
          backgroundColor: "var(--badge-scheduled-bg)",
          color: "var(--badge-scheduled-text)",
        };
      case "in_progress":
        return {
          backgroundColor: "var(--badge-registration-bg)",
          color: "var(--badge-registration-text)",
        };
      case "completed":
        return {
          backgroundColor: "var(--badge-group-bg)",
          color: "var(--badge-group-text)",
        };
      case "cancelled":
        return {
          backgroundColor: "var(--badge-completed-bg)",
          color: "var(--badge-completed-text)",
        };
      default:
        return {
          backgroundColor: "var(--badge-scheduled-bg)",
          color: "var(--badge-scheduled-text)",
        };
    }
  };

  const statusIcons: Record<string, React.ReactNode> = {
    scheduled: <Clock className="h-3 w-3" />,
    in_progress: <Target className="h-3 w-3" />,
    completed: <CheckCircle2 className="h-3 w-3" />,
    cancelled: <XCircle className="h-3 w-3" />,
  };

  return (
    <Link
      href={`/matches/${match.id}`}
      className="border-primary-light bg-surface hover:border-primary hover:bg-primary-light block rounded-lg border p-4 transition-colors"
    >
      <div className="flex items-center gap-2 text-xs">
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 font-medium"
          style={getStatusStyle(match.status)}
        >
          {statusIcons[match.status]}
          {match.status.replace("_", " ")}
        </span>
        {match.isKnockout && (
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 font-medium"
            style={{
              backgroundColor: "var(--badge-knockout-bg)",
              color: "var(--badge-knockout-text)",
            }}
          >
            <Trophy className="h-3 w-3" />
            Knockout
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span
          className={
            match.isMyTeamHome ? "text-foreground font-semibold" : "text-muted"
          }
        >
          {match.homeTeam?.name ?? "TBH"}
        </span>
        <span className="text-muted px-2">vs</span>
        <span
          className={
            !match.isMyTeamHome ? "text-foreground font-semibold" : "text-muted"
          }
        >
          {match.awayTeam?.name ?? "TBH"}
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
      className="border-primary-light bg-surface hover:border-primary hover:bg-primary-light flex items-center justify-between rounded-lg border p-4 transition-colors"
    >
      <div>
        <span className="text-foreground font-medium">{team.name}</span>
        <p className="text-muted text-xs">
          {team.members.length} member{team.members.length !== 1 ? "s" : ""}
        </p>
      </div>
      <ChevronRight className="text-muted h-5 w-5" />
    </Link>
  );
}
