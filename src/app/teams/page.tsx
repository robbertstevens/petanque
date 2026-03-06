import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { getMyTeams, getMyInvitations } from "@/lib/actions/teams";
import { CreateTeamForm } from "./create-team-form";
import { InvitationsList } from "./invitations-list";

export default async function TeamsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const [teams, invitations] = await Promise.all([
    getMyTeams(),
    getMyInvitations(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold text-black dark:text-white">
            My Teams
          </h1>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-medium text-black dark:text-white">
              Pending Invitations
            </h2>
            <InvitationsList invitations={invitations} />
          </section>
        )}

        {/* Create Team Form */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-black dark:text-white">
            Create a New Team
          </h2>
          <CreateTeamForm />
        </section>

        {/* Teams List */}
        <section>
          <h2 className="mb-4 text-lg font-medium text-black dark:text-white">
            Your Teams
          </h2>
          {teams.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              You are not a member of any teams yet. Create one above!
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-black dark:text-white">
                        {team.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {team.memberCount}{" "}
                        {team.memberCount === 1 ? "member" : "members"}
                      </p>
                    </div>
                    {team.isCaptain && (
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        Captain
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                    Captain: {team.captain.name ?? team.captain.username}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
