import Link from "next/link";
import {
  FileText,
  Pencil,
  Users,
  Play,
  CheckCircle,
  Plus,
  Eye,
  Trophy,
} from "lucide-react";

import { getAllCompetitions } from "@/lib/actions/competitions-admin";

export default async function AdminDashboard() {
  const competitions = await getAllCompetitions();

  const stats = {
    total: competitions.length,
    draft: competitions.filter((c) => c.status === "draft").length,
    registration: competitions.filter((c) => c.status === "registration")
      .length,
    active: competitions.filter(
      (c) => c.status === "group_stage" || c.status === "knockout",
    ).length,
    completed: competitions.filter((c) => c.status === "completed").length,
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Trophy className="h-6 w-6" />
        <h2 className="text-2xl font-semibold text-black dark:text-white">
          Admin Dashboard
        </h2>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <FileText className="h-4 w-4" />
            Total Competitions
          </div>
          <p className="text-2xl font-semibold text-black dark:text-white">
            {stats.total}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Pencil className="h-4 w-4" />
            Draft
          </div>
          <p className="text-2xl font-semibold text-zinc-500">{stats.draft}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Users className="h-4 w-4" />
            Registration Open
          </div>
          <p className="text-2xl font-semibold text-blue-600">
            {stats.registration}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Play className="h-4 w-4" />
            Active
          </div>
          <p className="text-2xl font-semibold text-green-600">
            {stats.active}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <CheckCircle className="h-4 w-4" />
            Completed
          </div>
          <p className="text-2xl font-semibold text-zinc-500">
            {stats.completed}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-black dark:text-white">
          <Trophy className="h-5 w-5" />
          Quick Actions
        </h3>
        <div className="flex gap-4">
          <Link
            href="/admin/competitions/new"
            className="flex items-center gap-1.5 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" />
            Create Competition
          </Link>
          <Link
            href="/admin/competitions"
            className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
          >
            <Eye className="h-4 w-4" />
            View All Competitions
          </Link>
        </div>
      </div>

      {/* Recent Competitions */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-black dark:text-white">
          <FileText className="h-5 w-5" />
          Recent Competitions
        </h3>
        {competitions.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            No competitions yet. Create your first one!
          </p>
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
                    Teams
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Groups
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                {competitions.slice(0, 5).map((comp) => (
                  <tr key={comp.id}>
                    <td className="px-4 py-3 text-sm text-black dark:text-white">
                      {comp.name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={comp.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {comp.teamCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {comp.groupCount}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/competitions/${comp.id}`}
                        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Trophy className="h-4 w-4" />
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function StatusBadge({
  status,
}: Readonly<{
  status: "draft" | "registration" | "group_stage" | "knockout" | "completed";
}>) {
  const styles = {
    draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    registration:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    group_stage:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    knockout:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    completed: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
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
      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
