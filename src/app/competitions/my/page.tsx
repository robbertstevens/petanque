import Link from "next/link";

import { getMyCompetitions } from "@/lib/actions/competitions";
import { WithdrawButton } from "./withdraw-button";

export default async function MyCompetitionsPage() {
  const registrations = await getMyCompetitions();

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: {
      label: "Draft",
      color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    },
    registration: {
      label: "Registration",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    group_stage: {
      label: "Group Stage",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    knockout: {
      label: "Knockout",
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    completed: {
      label: "Completed",
      color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    },
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
          {registrations.map((registration) => {
            const status = statusLabels[registration.competitionStatus] || {
              label: registration.competitionStatus,
              color: "bg-zinc-100 text-zinc-700",
            };

            return (
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
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {registration.teamName}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                      {registration.isCaptain && (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
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
            );
          })}
        </div>
      )}
    </div>
  );
}
