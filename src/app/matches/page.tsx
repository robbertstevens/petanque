import Link from "next/link";
import {
  Clock,
  PlayCircle,
  CheckCircle2,
  Trophy,
  XCircle,
  Inbox,
  ChevronRight,
} from "lucide-react";

import { getUpcomingMatches } from "@/lib/actions/matches";

export default async function MatchesPage() {
  const matches = await getUpcomingMatches();

  return (
    <div>
      <h2 className="font-display text-foreground mb-6 flex items-center gap-2 text-lg font-medium">
        <Clock className="text-primary h-5 w-5" />
        Upcoming Matches
      </h2>

      {matches.length === 0 ? (
        <div className="border-primary-light bg-surface rounded-lg border p-8 text-center">
          <Inbox className="text-muted mx-auto mb-3 h-12 w-12" />
          <p className="text-foreground">No upcoming matches for your teams.</p>
          <p className="text-muted mt-2 text-sm">
            Matches will appear here once your teams are registered in active
            competitions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

type MatchData = Awaited<ReturnType<typeof getUpcomingMatches>>[number];

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
    in_progress: <PlayCircle className="h-3 w-3" />,
    completed: <CheckCircle2 className="h-3 w-3" />,
    cancelled: <XCircle className="h-3 w-3" />,
  };

  return (
    <Link
      href={`/matches/${match.id}`}
      className="border-primary-light bg-surface hover:border-primary hover:bg-primary-light block rounded-lg border p-4 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={getStatusStyle(match.status)}
            >
              {statusIcons[match.status]}
              {match.status.replace("_", " ")}
            </span>
            {match.isKnockout && (
              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: "var(--badge-knockout-bg)",
                  color: "var(--badge-knockout-text)",
                }}
              >
                <Trophy className="h-3 w-3" />
                Knockout
              </span>
            )}
            {match.group && (
              <span className="text-muted text-xs">
                {match.group.name} • Round {match.round}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4">
            <div
              className={`flex-1 text-right ${match.isMyTeamHome ? "font-semibold" : ""}`}
            >
              <span
                className={
                  match.isMyTeamHome ? "text-foreground" : "text-muted"
                }
              >
                {match.homeTeam?.name ?? "TBH"}
              </span>
              {match.isMyTeamHome && (
                <span className="text-muted ml-2 text-xs">(Your team)</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-lg font-bold">
              {match.score ? (
                <>
                  <span className="text-foreground">
                    {match.score.homeScore}
                  </span>
                  <span className="text-muted">-</span>
                  <span className="text-foreground">
                    {match.score.awayScore}
                  </span>
                </>
              ) : (
                <span className="text-muted">vs</span>
              )}
            </div>

            <div
              className={`flex-1 text-left ${!match.isMyTeamHome ? "font-semibold" : ""}`}
            >
              {!match.isMyTeamHome && (
                <span className="text-muted mr-2 text-xs">(Your team)</span>
              )}
              <span
                className={
                  !match.isMyTeamHome ? "text-foreground" : "text-muted"
                }
              >
                {match.awayTeam?.name ?? "TBH"}
              </span>
            </div>
          </div>

          <div className="text-muted mt-3 text-xs">
            {match.competition.name}
          </div>
        </div>

        <div className="ml-4">
          <ChevronRight className="text-muted h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}
