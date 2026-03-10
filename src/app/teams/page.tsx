import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { Users, Crown, Mail, Inbox } from "lucide-react";

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
    <div className="min-h-screen">
      <header className="border-primary-light bg-surface border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="font-display text-foreground flex items-center gap-2 text-xl font-semibold">
            <Users className="text-accent h-5 w-5" />
            My Teams
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <section className="mb-8">
            <h2 className="font-display text-foreground mb-4 flex items-center gap-2 text-lg font-medium">
              <Mail className="text-primary h-5 w-5" />
              Pending Invitations
            </h2>
            <InvitationsList invitations={invitations} />
          </section>
        )}

        {/* Create Team Form */}
        <section className="mb-8">
          <h2 className="text-foreground mb-4 flex items-center gap-2 text-lg font-medium">
            <Users className="text-accent h-5 w-5" />
            Create a New Team
          </h2>
          <CreateTeamForm />
        </section>

        {/* Teams List */}
        <section>
          <h2 className="text-foreground mb-4 flex items-center gap-2 text-lg font-medium">
            <Users className="text-accent h-5 w-5" />
            Your Teams
          </h2>
          {teams.length === 0 ? (
            <div className="border-primary-light bg-surface rounded-lg border p-8 text-center">
              <Inbox className="text-muted mx-auto mb-3 h-12 w-12" />
              <p className="text-foreground">
                You are not a member of any teams yet. Create one above!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="border-primary-light bg-surface hover:border-primary hover:bg-primary-light block rounded-lg border p-4 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-foreground font-medium">
                        {team.name}
                      </h3>
                      <p className="text-muted mt-1 text-sm">
                        {team.memberCount}{" "}
                        {team.memberCount === 1 ? "member" : "members"}
                      </p>
                    </div>
                    {team.isCaptain && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: "var(--badge-knockout-bg)",
                          color: "var(--badge-knockout-text)",
                        }}
                      >
                        <Crown className="h-3 w-3" />
                        Captain
                      </span>
                    )}
                  </div>
                  <p className="text-muted mt-2 text-xs">
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
