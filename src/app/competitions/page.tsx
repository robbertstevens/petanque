import Link from "next/link";
import { Trophy, Target, Users, Calendar, Inbox } from "lucide-react";

import { getCompetitionsByStatus } from "@/lib/actions/competitions-user";

export default async function CompetitionsBrowsePage() {
  const competitions = await getCompetitionsByStatus("all-active");

  return (
    <div>
      <h2 className="text-foreground mb-6 flex items-center gap-2 text-lg font-medium">
        <Trophy className="text-primary h-5 w-5" />
        Active Competitions
      </h2>

      {competitions.length === 0 ? (
        <div className="border-primary-light bg-surface rounded-lg border p-8 text-center">
          <Inbox className="text-muted mx-auto mb-3 h-12 w-12" />
          <p className="text-foreground">
            No active competitions at the moment.
          </p>
          <p className="text-muted mt-2 text-sm">
            Check back later or view the archive for completed competitions.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {competitions.map((competition) => (
            <Link
              key={competition.id}
              href={`/competitions/${competition.id}`}
              className="border-primary-light bg-surface hover:border-primary hover:bg-primary-light block rounded-lg border p-4 transition-colors"
            >
              <h3 className="text-foreground font-medium">
                {competition.name}
              </h3>
              {competition.description && (
                <p className="text-muted mt-1 line-clamp-2 text-sm">
                  {competition.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {competition.status === "registration" && (
                  <span
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--badge-registration-bg)",
                      color: "var(--badge-registration-text)",
                    }}
                  >
                    <Target className="h-3 w-3" />
                    Open for Registration
                  </span>
                )}
                {competition.status === "group_stage" && (
                  <span
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--badge-group-bg)",
                      color: "var(--badge-group-text)",
                    }}
                  >
                    <Users className="h-3 w-3" />
                    Group Stage
                  </span>
                )}
                {competition.status === "knockout" && (
                  <span
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--badge-knockout-bg)",
                      color: "var(--badge-knockout-text)",
                    }}
                  >
                    <Trophy className="h-3 w-3" />
                    Knockout Stage
                  </span>
                )}
                <span
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--badge-scheduled-bg)",
                    color: "var(--badge-scheduled-text)",
                  }}
                >
                  <Users className="h-3 w-3" />
                  {competition.teamSize} players/team
                </span>
                <span
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--badge-scheduled-bg)",
                    color: "var(--badge-scheduled-text)",
                  }}
                >
                  <Users className="h-3 w-3" />
                  {competition.registeredTeamCount} team
                  {competition.registeredTeamCount !== 1 ? "s" : ""} registered
                </span>
              </div>
              {(competition.startDate || competition.endDate) && (
                <div className="text-muted mt-3 flex items-center gap-1 text-xs">
                  <Calendar className="text-muted h-3 w-3" />
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
