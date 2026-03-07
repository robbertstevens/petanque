"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";

import {
  createGroup,
  updateGroup,
  deleteGroup,
  generateGroupSchedule,
} from "@/lib/actions/competitions-admin";

type Group = {
  id: string;
  name: string;
  competitionTeams: { id: string; team: { id: string; name: string } }[];
  matches: { id: string }[];
};

type State = { error?: string; success?: boolean; matchCount?: number } | null;

export function GroupsManager({
  competitionId,
  groups,
  status,
}: Readonly<{
  competitionId: string;
  groups: Group[];
  status: string;
}>) {
  const canModify = status === "draft" || status === "registration";

  return (
    <div className="space-y-4">
      {canModify && <CreateGroupForm competitionId={competitionId} />}

      {groups.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          No groups created yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              canModify={canModify}
              canGenerateSchedule={
                status === "registration" || status === "group_stage"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateGroupForm({
  competitionId,
}: Readonly<{ competitionId: string }>) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prevState, formData) => {
      const result = await createGroup(competitionId, formData);
      return result;
    },
    null,
  );

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="flex gap-3">
      <input
        type="text"
        name="name"
        placeholder="Group name (e.g., Group A)"
        required
        className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none sm:max-w-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {isPending ? "..." : "Add Group"}
      </button>
      {state?.error && (
        <p className="self-center text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}

function GroupCard({
  group,
  canModify,
  canGenerateSchedule,
}: Readonly<{
  group: Group;
  canModify: boolean;
  canGenerateSchedule: boolean;
}>) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const [deleteState, deleteAction, isDeleting] = useActionState<
    State,
    FormData
  >(async () => {
    const result = await deleteGroup(group.id);
    if (result.success) {
      router.refresh();
    }
    return result;
  }, null);

  const [scheduleState, scheduleAction, isGenerating] = useActionState<
    State,
    FormData
  >(async () => {
    const result = await generateGroupSchedule(group.id);
    if (result.success) {
      router.refresh();
    }
    return result;
  }, null);

  const canDelete =
    canModify &&
    group.competitionTeams.length === 0 &&
    group.matches.length === 0;
  const hasSchedule = group.matches.length > 0;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {isEditing ? (
        <EditGroupForm group={group} onClose={() => setIsEditing(false)} />
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-black dark:text-white">
                {group.name}
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {group.competitionTeams.length} teams, {group.matches.length}{" "}
                matches
              </p>
            </div>
            {canModify && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Edit
              </button>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {/* Generate Schedule */}
            {canGenerateSchedule &&
              !hasSchedule &&
              group.competitionTeams.length >= 2 && (
                <form action={scheduleAction}>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    {isGenerating ? "Generating..." : "Generate Schedule"}
                  </button>
                </form>
              )}

            {scheduleState?.success && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Created {scheduleState.matchCount} matches
              </p>
            )}

            {/* Delete */}
            {canDelete && (
              <form action={deleteAction}>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="w-full rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400"
                >
                  {isDeleting ? "..." : "Delete"}
                </button>
              </form>
            )}
          </div>

          {(deleteState?.error || scheduleState?.error) && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {deleteState?.error || scheduleState?.error}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function EditGroupForm({
  group,
  onClose,
}: Readonly<{
  group: Group;
  onClose: () => void;
}>) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prevState, formData) => {
      const result = await updateGroup(group.id, formData);
      if (result.success) {
        router.refresh();
        onClose();
      }
      return result;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input
        type="text"
        name="name"
        defaultValue={group.name}
        required
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isPending ? "..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
        >
          Cancel
        </button>
      </div>
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}
