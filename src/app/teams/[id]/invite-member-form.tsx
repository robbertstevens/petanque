"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useRef, useEffect } from "react";

import { inviteToTeam } from "@/lib/actions/teams";

type State = { error?: string; success?: boolean } | null;

export function InviteMemberForm({
  teamId,
}: Readonly<{ teamId: string }>) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prevState, formData) => {
      const result = await inviteToTeam(teamId, formData);
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
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        name="username"
        placeholder="Username to invite"
        required
        className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {isPending ? "Inviting..." : "Send Invitation"}
      </button>
      {state?.error && (
        <p className="self-center text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="self-center text-sm text-green-600 dark:text-green-400">
          Invitation sent!
        </p>
      )}
    </form>
  );
}
