"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { cancelInvitation } from "@/lib/actions/teams";

type Invitation = {
  id: string;
  invitedUser: {
    name: string | null;
    username: string | null;
  };
  invitedByUser: {
    name: string | null;
    username: string | null;
  };
  createdAt: Date;
};

type State = { error?: string; success?: boolean } | null;

function PendingInvitationCard({
  invitation,
}: Readonly<{ invitation: Invitation }>) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async () => {
      const result = await cancelInvitation(invitation.id);
      if (result.success) {
        router.refresh();
      }
      return result;
    },
    null,
  );

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <p className="font-medium text-black dark:text-white">
          @{invitation.invitedUser.username}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Invited{" "}
          {new Date(invitation.createdAt).toLocaleDateString()}
        </p>
        {state?.error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}
      </div>
      <form action={formAction}>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
        >
          {isPending ? "..." : "Cancel"}
        </button>
      </form>
    </div>
  );
}

export function PendingInvitationsList({
  invitations,
}: Readonly<{ invitations: Invitation[] }>) {
  return (
    <div className="space-y-3">
      {invitations.map((invitation) => (
        <PendingInvitationCard key={invitation.id} invitation={invitation} />
      ))}
    </div>
  );
}
