"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { assignTeamToGroup } from "@/lib/actions/competitions";

type Team = {
  id: string;
  teamId: string;
  groupId: string | null;
  team: {
    id: string;
    name: string;
    members: { user: { name: string | null; username: string | null } }[];
  };
};

type Group = {
  id: string;
  name: string;
};

type State = { error?: string; success?: boolean } | null;

export function TeamsManager({
  teams,
  groups,
  status,
}: Readonly<{
  competitionId: string;
  teams: Team[];
  groups: Group[];
  status: string;
}>) {
  const canAssign = status === "draft" || status === "registration";

  if (teams.length === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        No teams registered yet. Teams can register when the competition is in
        &quot;Registration&quot; status.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full">
        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Team
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Members
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Group
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
          {teams.map((compTeam) => (
            <TeamRow
              key={compTeam.id}
              compTeam={compTeam}
              groups={groups}
              canAssign={canAssign}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamRow({
  compTeam,
  groups,
  canAssign,
}: Readonly<{
  compTeam: Team;
  groups: Group[];
  canAssign: boolean;
}>) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prevState, formData) => {
      const groupId = formData.get("groupId") as string;
      const result = await assignTeamToGroup(
        compTeam.id,
        groupId === "" ? null : groupId,
      );
      if (result.success) {
        router.refresh();
      }
      return result;
    },
    null,
  );

  const currentGroup = groups.find((g) => g.id === compTeam.groupId);
  const memberNames = compTeam.team.members
    .map((m) => m.user.name ?? m.user.username ?? "Unknown")
    .join(", ");

  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium text-black dark:text-white">
          {compTeam.team.name}
        </p>
      </td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
        {memberNames}
      </td>
      <td className="px-4 py-3">
        {canAssign ? (
          <form action={formAction} className="flex items-center gap-2">
            <select
              name="groupId"
              defaultValue={compTeam.groupId ?? ""}
              disabled={isPending}
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">Unassigned</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-black px-2 py-1 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {isPending ? "..." : "Assign"}
            </button>
            {state?.error && (
              <span className="text-sm text-red-600 dark:text-red-400">
                {state.error}
              </span>
            )}
          </form>
        ) : (
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {currentGroup?.name ?? "Unassigned"}
          </span>
        )}
      </td>
    </tr>
  );
}
