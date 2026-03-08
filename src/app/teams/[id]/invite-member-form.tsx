"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useRef, useEffect } from "react";
import { UserPlus, Send, Loader2, Check } from "lucide-react";

import { inviteToTeam } from "@/lib/actions/teams";

type State = { error?: string; success?: boolean } | null;

export function InviteMemberForm({ teamId }: Readonly<{ teamId: string }>) {
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
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <div className="relative flex-1">
        <UserPlus className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          name="username"
          placeholder="Username to invite"
          required
          className="w-full rounded-md border border-zinc-300 py-2 pr-3 pl-9 text-black focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-1.5 rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state?.success ? (
          <Check className="h-4 w-4" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isPending
          ? "Inviting..."
          : state?.success
            ? "Sent!"
            : "Send Invitation"}
      </button>
      {state?.error && (
        <p className="self-center text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
