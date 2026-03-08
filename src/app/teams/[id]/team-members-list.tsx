"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Crown, User, Trash2, Loader2 } from "lucide-react";

import { removeMember } from "@/lib/actions/teams";

type Member = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
  };
  joinedAt: Date;
};

type State = { error?: string; success?: boolean } | null;

function MemberCard({
  member,
  captainUserId,
  isCaptain,
  teamId,
}: Readonly<{
  member: Member;
  captainUserId: string;
  isCaptain: boolean;
  teamId: string;
}>) {
  const router = useRouter();
  const isThisCaptain = member.userId === captainUserId;
  const canRemove = isCaptain && !isThisCaptain;

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async () => {
      const result = await removeMember(teamId, member.userId);
      if (result.success) {
        router.refresh();
      }
      return result;
    },
    null,
  );

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
          {(member.user.name ?? member.user.username ?? "?")[0].toUpperCase()}
        </div>
        <div>
          <p className="flex items-center gap-1 font-medium text-black dark:text-white">
            {member.user.name ?? member.user.username}
            {isThisCaptain && (
              <Crown className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
            )}
          </p>
          <p className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
            <User className="h-3 w-3" />@{member.user.username}
          </p>
        </div>
      </div>
      {canRemove && (
        <form action={formAction}>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isPending ? "..." : "Remove"}
          </button>
        </form>
      )}
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </div>
  );
}

export function TeamMembersList({
  members,
  captainUserId,
  isCaptain,
  teamId,
}: Readonly<{
  members: Member[];
  captainUserId: string;
  isCaptain: boolean;
  teamId: string;
}>) {
  // Sort members: captain first, then by name
  const sortedMembers = [...members].sort((a, b) => {
    if (a.userId === captainUserId) return -1;
    if (b.userId === captainUserId) return 1;
    return (a.user.name ?? a.user.username ?? "").localeCompare(
      b.user.name ?? b.user.username ?? "",
    );
  });

  return (
    <div className="space-y-3">
      {sortedMembers.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          captainUserId={captainUserId}
          isCaptain={isCaptain}
          teamId={teamId}
        />
      ))}
    </div>
  );
}
