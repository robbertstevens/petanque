import Link from "next/link";

import { getMyCompetitions } from "@/lib/actions/competitions-user";
import { WithdrawButton } from "./withdraw-button";

export default async function MyCompetitionsPage() {
  const registrations = await getMyCompetitions();

  const getStatusStyle = (
    status: string,
  ): { backgroundColor: string; color: string } => {
    switch (status) {
      case "draft":
        return {
          backgroundColor: "var(--badge-draft-bg)",
          color: "var(--badge-draft-text)",
        };
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
          backgroundColor: "var(--badge-draft-bg)",
          color: "var(--badge-draft-text)",
        };
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-lg font-medium text-black dark:text-white">
        My Competitions
      </h2>

      {registrations.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-600 dark:text-zinc-400">
            You are not registered for any competitions yet.
          </p>
          <Link
            href="/competitions"
            className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Browse Competitions
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((registration) => (
            <div
              key={registration.registrationId}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/competitions/${registration.competitionId}`}
                    className="font-medium text-black hover:underline dark:text-white"
                  >
                    {registration.competitionName}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: "var(--badge-scheduled-bg)",
                        color: "var(--badge-scheduled-text)",
                      }}
                    >
                      {registration.teamName}
                    </span>
                    <span
                      className="rounded-full px-2 py-1 text-xs font-medium"
                      style={getStatusStyle(registration.competitionStatus)}
                    >
                      {registration.competitionStatus.replace("_", " ")}
                    </span>
                    {registration.isCaptain && (
                      <span
                        className="rounded-full px-2 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: "var(--badge-knockout-bg)",
                          color: "var(--badge-knockout-text)",
                        }}
                      >
                        Captain
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(registration.competitionStartDate ||
                    registration.competitionEndDate) && (
                    <div className="text-right text-xs text-zinc-500 dark:text-zinc-500">
                      {registration.competitionStartDate && (
                        <div>
                          Starts:{" "}
                          {new Date(
                            registration.competitionStartDate,
                          ).toLocaleDateString()}
                        </div>
                      )}
                      {registration.competitionEndDate && (
                        <div>
                          Ends:{" "}
                          {new Date(
                            registration.competitionEndDate,
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {registration.canWithdraw && (
                <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <WithdrawButton
                    competitionId={registration.competitionId}
                    competitionName={registration.competitionName}
                    teamId={registration.teamId}
                    teamName={registration.teamName}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
