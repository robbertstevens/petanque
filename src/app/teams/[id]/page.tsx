import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { getTeam } from "@/lib/actions/teams";
import { InviteMemberForm } from "./invite-member-form";
import { TeamMembersList } from "./team-members-list";
import { PendingInvitationsList } from "./pending-invitations-list";
import { TeamActions } from "./team-actions";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TeamDetailPage({ params }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const { id } = await params;
  const team = await getTeam(id);

  if (!team) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <Link
              href="/teams"
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              &larr; Back to Teams
            </Link>
            <h1 className="mt-1 text-xl font-semibold text-black dark:text-white">
              {team.name}
            </h1>
          </div>
          {team.isCaptain && (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              You are the Captain
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Team Members */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-black dark:text-white">
            Team Members ({team.members.length})
          </h2>
          <TeamMembersList
            members={team.members}
            captainUserId={team.captainUserId}
            isCaptain={team.isCaptain}
            teamId={team.id}
          />
        </section>

        {/* Invite Member (Captain only) */}
        {team.isCaptain && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-medium text-black dark:text-white">
              Invite Member
            </h2>
            <InviteMemberForm teamId={team.id} />
          </section>
        )}

        {/* Pending Invitations (Captain only) */}
        {team.isCaptain && team.invitations.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-medium text-black dark:text-white">
              Pending Invitations
            </h2>
            <PendingInvitationsList invitations={team.invitations} />
          </section>
        )}

        {/* Team Actions */}
        <section>
          <h2 className="mb-4 text-lg font-medium text-black dark:text-white">
            Actions
          </h2>
          <TeamActions
            teamId={team.id}
            isCaptain={team.isCaptain}
            isMember={team.isMember}
          />
        </section>
      </main>
    </div>
  );
}
