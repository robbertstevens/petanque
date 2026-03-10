import Link from "next/link";

import { getAllCompetitions } from "@/lib/actions/competitions-admin";
import { Table } from "@/components/table";

import { StatusBadge } from "./status-badge";

type Competition = {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "registration" | "group_stage" | "knockout" | "completed";
  teamSize: number;
  teamCount: number;
  groupCount: number;
  startDate: Date | null;
  endDate: Date | null;
};

export default async function CompetitionsPage() {
  const competitions = await getAllCompetitions();

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (comp: Competition) => (
        <div>
          <p className="font-medium text-black dark:text-white">{comp.name}</p>
          {comp.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              {comp.description.length > 50
                ? `${comp.description.slice(0, 50)}...`
                : comp.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (comp: Competition) => <StatusBadge status={comp.status} />,
    },
    {
      key: "teamSize",
      header: "Team Size",
      cell: (comp: Competition) => (
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {comp.teamSize} players
        </span>
      ),
    },
    {
      key: "teams",
      header: "Teams",
      cell: (comp: Competition) => (
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {comp.teamCount}
        </span>
      ),
    },
    {
      key: "groups",
      header: "Groups",
      cell: (comp: Competition) => (
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {comp.groupCount}
        </span>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      cell: (comp: Competition) => (
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {comp.startDate ? new Date(comp.startDate).toLocaleDateString() : "-"}
          {comp.endDate && (
            <> - {new Date(comp.endDate).toLocaleDateString()}</>
          )}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (comp: Competition) => (
        <Link
          href={`/admin/competitions/${comp.id}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Manage
        </Link>
      ),
    },
  ];

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
        <Table
          data={competitions}
          columns={columns}
          keyExtractor={(comp) => comp.id}
        />
      )}
    </main>
  );
}
