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
        <Trophy className="text-primary h-6 w-6" />
        <h2 className="text-foreground text-2xl font-semibold">
          Admin Dashboard
        </h2>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="border-primary-light bg-surface rounded-lg border p-4">
          <div className="text-muted mb-2 flex items-center gap-2 text-sm">
            <FileText className="text-primary h-4 w-4" />
            Total Competitions
          </div>
          <p className="text-foreground text-2xl font-semibold">
            {stats.total}
          </p>
        </div>
        <div className="border-primary-light bg-surface rounded-lg border p-4">
          <div className="text-muted mb-2 flex items-center gap-2 text-sm">
            <Pencil className="text-muted h-4 w-4" />
            Draft
          </div>
          <p className="text-muted text-2xl font-semibold">{stats.draft}</p>
        </div>
        <div className="border-primary-light bg-surface rounded-lg border p-4">
          <div className="text-muted mb-2 flex items-center gap-2 text-sm">
            <Users className="text-primary h-4 w-4" />
            Registration Open
          </div>
          <p className="text-primary text-2xl font-semibold">
            {stats.registration}
          </p>
        </div>
        <div className="border-primary-light bg-surface rounded-lg border p-4">
          <div className="text-muted mb-2 flex items-center gap-2 text-sm">
            <Play className="text-accent h-4 w-4" />
            Active
          </div>
          <p className="text-accent text-2xl font-semibold">{stats.active}</p>
        </div>
        <div className="border-primary-light bg-surface rounded-lg border p-4">
          <div className="text-muted mb-2 flex items-center gap-2 text-sm">
            <CheckCircle className="text-muted h-4 w-4" />
            Completed
          </div>
          <p className="text-muted text-2xl font-semibold">{stats.completed}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-medium">
          <Trophy className="text-primary h-5 w-5" />
          Quick Actions
        </h3>
        <div className="flex gap-4">
          <Link
            href="/admin/competitions/new"
            className="bg-primary hover:bg-primary/90 flex items-center gap-1.5 rounded-md px-4 py-2 font-medium text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Competition
          </Link>
          <Link
            href="/admin/competitions"
            className="border-primary-light bg-surface text-foreground hover:bg-primary-light flex items-center gap-1.5 rounded-md border px-4 py-2 font-medium transition-colors"
          >
            <Eye className="h-4 w-4" />
            View All Competitions
          </Link>
        </div>
      </div>

      {/* Recent Competitions */}
      <div>
        <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-medium">
          <FileText className="text-primary h-5 w-5" />
          Recent Competitions
        </h3>
        {competitions.length === 0 ? (
          <p className="text-foreground">
            No competitions yet. Create your first one!
          </p>
        ) : (
          <div className="border-primary-light overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-primary-light">
                <tr>
                  <th className="text-foreground px-4 py-3 text-left text-sm font-medium">
                    Name
                  </th>
                  <th className="text-foreground px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="text-foreground px-4 py-3 text-left text-sm font-medium">
                    Teams
                  </th>
                  <th className="text-foreground px-4 py-3 text-left text-sm font-medium">
                    Groups
                  </th>
                  <th className="text-foreground px-4 py-3 text-left text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-primary-light bg-surface divide-y">
                {competitions.slice(0, 5).map((comp) => (
                  <tr key={comp.id}>
                    <td className="text-foreground px-4 py-3 text-sm">
                      {comp.name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={comp.status} />
                    </td>
                    <td className="text-muted px-4 py-3 text-sm">
                      {comp.teamCount}
                    </td>
                    <td className="text-muted px-4 py-3 text-sm">
                      {comp.groupCount}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/competitions/${comp.id}`}
                        className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
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
  const getStatusStyle = (s: typeof status) => {
    switch (s) {
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
      style={getStatusStyle(status)}
    >
      {labels[status]}
    </span>
  );
}
