"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createTeam } from "@/lib/actions/teams";

type State = { error?: string; success?: boolean; teamId?: string } | null;

export function CreateTeamForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prevState, formData) => {
      const result = await createTeam(formData);
      return result;
    },
    null,
  );

  useEffect(() => {
    if (state?.success && state.teamId) {
      router.push(`/teams/${state.teamId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex gap-3">
      <input
        type="text"
        name="name"
        placeholder="Team name"
        required
        minLength={2}
        maxLength={50}
        className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {isPending ? "Creating..." : "Create Team"}
      </button>
      {state?.error && (
        <p className="self-center text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
