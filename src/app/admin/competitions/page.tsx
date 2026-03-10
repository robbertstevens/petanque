import Link from "next/link";

import { getAllCompetitions } from "@/lib/actions/competitions-admin";

export default async function CompetitionsPage() {
  const competitions = await getAllCompetitions();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-foreground text-2xl font-semibold">
          Competitions
        </h2>
        <Link
          href="/admin/competitions/new"
          className="rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Create Competition
        </Link>
      </div>

      {competitions.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-600 dark:text-zinc-400">
            No competitions yet.
          </p>
          <Link
            href="/admin/competitions/new"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Create your first competition
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Team Size
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Teams
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Groups
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Dates
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
              {competitions.map((comp) => (
                <tr key={comp.id}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-black dark:text-white">
                        {comp.name}
                      </p>
                      {comp.description && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-500">
                          {comp.description.length > 50
                            ? `${comp.description.slice(0, 50)}...`
                            : comp.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={comp.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {comp.teamSize} players
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {comp.teamCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {comp.groupCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {comp.startDate
                      ? new Date(comp.startDate).toLocaleDateString()
                      : "-"}
                    {comp.endDate && (
                      <> - {new Date(comp.endDate).toLocaleDateString()}</>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/competitions/${comp.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function StatusBadge({
  status,
}: Readonly<{
  status: "draft" | "registration" | "group_stage" | "knockout" | "completed";
}>) {
  const getStatusStyle = () => {
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

  const labels = {
    draft: "Draft",
    registration: "Registration",
    group_stage: "Group Stage",
    knockout: "Knockout",
    completed: "Completed",
  };

  return (
    <span
      className="inline-block rounded-full px-2 py-1 text-xs font-medium"
      style={getStatusStyle()}
    >
      {labels[status]}
    </span>
  );
}
