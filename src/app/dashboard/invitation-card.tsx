"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { respondToInvitation } from "@/lib/actions/teams";

export type Invitation = {
  id: string;
  team: {
    id: string;
    name: string;
  };
  invitedByUser: {
    name: string | null;
    username: string | null;
  };
};

type State = { error?: string; success?: boolean } | null;

export function InvitationCard({
  invitation,
}: Readonly<{ invitation: Invitation }>) {
  const router = useRouter();

  const [acceptState, acceptAction, isAccepting] = useActionState<
    State,
    FormData
  >(async () => {
    const result = await respondToInvitation(invitation.id, true);
    if (result.success) {
      router.refresh();
    }
    return result;
  }, null);

  const [declineState, declineAction, isDeclining] = useActionState<
    State,
    FormData
  >(async () => {
    const result = await respondToInvitation(invitation.id, false);
    if (result.success) {
      router.refresh();
    }
    return result;
  }, null);

  const isPending = isAccepting || isDeclining;
  const error = acceptState?.error ?? declineState?.error;

  return (
    <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <div>
        <p className="font-medium text-black dark:text-white">
          {invitation.team.name}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Invited by{" "}
          {invitation.invitedByUser.name ?? invitation.invitedByUser.username}
        </p>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
      <div className="flex gap-2">
        <form action={acceptAction}>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAccepting ? "..." : "Accept"}
          </button>
        </form>
        <form action={declineAction}>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
          >
            {isDeclining ? "..." : "Decline"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function InvitationsList({
  invitations,
}: Readonly<{ invitations: Invitation[] }>) {
  if (invitations.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
          {invitations.length}
        </span>
        <h2 className="text-lg font-medium text-black dark:text-white">
          Pending Invitations
        </h2>
      </div>
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <InvitationCard key={invitation.id} invitation={invitation} />
        ))}
      </div>
    </section>
  );
}
