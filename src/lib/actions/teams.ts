"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { team, teamMember, teamInvitation } from "@/db/competition-schema";
import { user } from "@/db/auth-schema";
import { getCurrentUser } from "./auth-utils";

// ============================================================================
// Create Team
// ============================================================================

export async function createTeam(formData: FormData) {
  const currentUser = await getCurrentUser();
  const name = formData.get("name") as string;

  if (!name || name.trim().length === 0) {
    return { error: "Team name is required" };
  }

  if (name.trim().length < 2) {
    return { error: "Team name must be at least 2 characters" };
  }

  if (name.trim().length > 50) {
    return { error: "Team name must be less than 50 characters" };
  }

  // Check if team name already exists
  const existingTeam = await db.query.team.findFirst({
    where: eq(team.name, name.trim()),
  });

  if (existingTeam) {
    return { error: "A team with this name already exists" };
  }

  // Create the team
  const [newTeam] = await db
    .insert(team)
    .values({
      name: name.trim(),
      captainUserId: currentUser.id,
    })
    .returning();

  // Add the captain as a team member
  await db.insert(teamMember).values({
    teamId: newTeam.id,
    userId: currentUser.id,
  });

  revalidatePath("/teams");
  return { success: true, teamId: newTeam.id };
}

// ============================================================================
// Get User's Teams (as member or captain)
// ============================================================================

export async function getMyTeams() {
  const currentUser = await getCurrentUser();

  const memberships = await db.query.teamMember.findMany({
    where: eq(teamMember.userId, currentUser.id),
    with: {
      team: {
        with: {
          captain: true,
          members: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  });

  return memberships.map((m) => ({
    ...m.team,
    isCaptain: m.team.captainUserId === currentUser.id,
    memberCount: m.team.members.length,
  }));
}

// ============================================================================
// Get Team by ID
// ============================================================================

export async function getTeam(teamId: string) {
  const currentUser = await getCurrentUser();

  const teamData = await db.query.team.findFirst({
    where: eq(team.id, teamId),
    with: {
      captain: true,
      members: {
        with: {
          user: true,
        },
      },
      invitations: {
        where: eq(teamInvitation.status, "pending"),
        with: {
          invitedUser: true,
          invitedByUser: true,
        },
      },
    },
  });

  if (!teamData) {
    return null;
  }

  // Check if current user is a member
  const isMember = teamData.members.some((m) => m.userId === currentUser.id);
  const isCaptain = teamData.captainUserId === currentUser.id;

  return {
    ...teamData,
    isMember,
    isCaptain,
  };
}

// ============================================================================
// Invite User to Team
// ============================================================================

export async function inviteToTeam(teamId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  const username = formData.get("username") as string;

  if (!username || username.trim().length === 0) {
    return { error: "Username is required" };
  }

  // Get the team and verify captain
  const teamData = await db.query.team.findFirst({
    where: eq(team.id, teamId),
    with: {
      members: true,
      invitations: {
        where: eq(teamInvitation.status, "pending"),
      },
    },
  });

  if (!teamData) {
    return { error: "Team not found" };
  }

  if (teamData.captainUserId !== currentUser.id) {
    return { error: "Only the team captain can invite members" };
  }

  // Find the user to invite
  const userToInvite = await db.query.user.findFirst({
    where: eq(user.username, username.trim()),
  });

  if (!userToInvite) {
    return { error: "User not found" };
  }

  if (userToInvite.id === currentUser.id) {
    return { error: "You cannot invite yourself" };
  }

  // Check if user is already a member
  const isAlreadyMember = teamData.members.some(
    (m) => m.userId === userToInvite.id,
  );
  if (isAlreadyMember) {
    return { error: "User is already a team member" };
  }

  // Check if there's already a pending invitation
  const hasPendingInvitation = teamData.invitations.some(
    (inv) => inv.invitedUserId === userToInvite.id,
  );
  if (hasPendingInvitation) {
    return { error: "User already has a pending invitation" };
  }

  // Create the invitation
  await db.insert(teamInvitation).values({
    teamId,
    invitedUserId: userToInvite.id,
    invitedByUserId: currentUser.id,
  });

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams/invitations");
  return { success: true };
}

// ============================================================================
// Get Pending Invitations for Current User
// ============================================================================

export async function getMyInvitations() {
  const currentUser = await getCurrentUser();

  const invitations = await db.query.teamInvitation.findMany({
    where: and(
      eq(teamInvitation.invitedUserId, currentUser.id),
      eq(teamInvitation.status, "pending"),
    ),
    with: {
      team: {
        with: {
          captain: true,
        },
      },
      invitedByUser: true,
    },
    orderBy: (inv, { desc }) => desc(inv.createdAt),
  });

  return invitations;
}

// ============================================================================
// Respond to Invitation (Accept/Decline)
// ============================================================================

export async function respondToInvitation(
  invitationId: string,
  accept: boolean,
) {
  const currentUser = await getCurrentUser();

  // Get the invitation
  const invitation = await db.query.teamInvitation.findFirst({
    where: and(
      eq(teamInvitation.id, invitationId),
      eq(teamInvitation.invitedUserId, currentUser.id),
      eq(teamInvitation.status, "pending"),
    ),
  });

  if (!invitation) {
    return { error: "Invitation not found or already responded" };
  }

  if (accept) {
    // Add user to team
    await db.insert(teamMember).values({
      teamId: invitation.teamId,
      userId: currentUser.id,
    });
  }

  // Update invitation status
  await db
    .update(teamInvitation)
    .set({
      status: accept ? "accepted" : "declined",
      respondedAt: new Date(),
    })
    .where(eq(teamInvitation.id, invitationId));

  revalidatePath("/teams");
  revalidatePath("/teams/invitations");
  return { success: true };
}

// ============================================================================
// Leave Team
// ============================================================================

export async function leaveTeam(teamId: string) {
  const currentUser = await getCurrentUser();

  const teamData = await db.query.team.findFirst({
    where: eq(team.id, teamId),
    with: {
      members: true,
    },
  });

  if (!teamData) {
    return { error: "Team not found" };
  }

  if (teamData.captainUserId === currentUser.id) {
    return { error: "Team captain cannot leave. Transfer captaincy first." };
  }

  // Check if user is a member
  const membership = teamData.members.find((m) => m.userId === currentUser.id);
  if (!membership) {
    return { error: "You are not a member of this team" };
  }

  // Remove member
  await db
    .delete(teamMember)
    .where(
      and(eq(teamMember.teamId, teamId), eq(teamMember.userId, currentUser.id)),
    );

  revalidatePath("/teams");
  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

// ============================================================================
// Remove Member from Team (Captain only)
// ============================================================================

export async function removeMember(teamId: string, userId: string) {
  const currentUser = await getCurrentUser();

  const teamData = await db.query.team.findFirst({
    where: eq(team.id, teamId),
  });

  if (!teamData) {
    return { error: "Team not found" };
  }

  if (teamData.captainUserId !== currentUser.id) {
    return { error: "Only the team captain can remove members" };
  }

  if (userId === currentUser.id) {
    return { error: "You cannot remove yourself as captain" };
  }

  await db
    .delete(teamMember)
    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)));

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

// ============================================================================
// Cancel Invitation (Captain only)
// ============================================================================

export async function cancelInvitation(invitationId: string) {
  const currentUser = await getCurrentUser();

  const invitation = await db.query.teamInvitation.findFirst({
    where: eq(teamInvitation.id, invitationId),
    with: {
      team: true,
    },
  });

  if (!invitation) {
    return { error: "Invitation not found" };
  }

  if (invitation.team.captainUserId !== currentUser.id) {
    return { error: "Only the team captain can cancel invitations" };
  }

  await db.delete(teamInvitation).where(eq(teamInvitation.id, invitationId));

  revalidatePath(`/teams/${invitation.teamId}`);
  return { success: true };
}

// ============================================================================
// Delete Team (Captain only)
// ============================================================================

export async function deleteTeam(teamId: string) {
  const currentUser = await getCurrentUser();

  const teamData = await db.query.team.findFirst({
    where: eq(team.id, teamId),
  });

  if (!teamData) {
    return { error: "Team not found" };
  }

  if (teamData.captainUserId !== currentUser.id) {
    return { error: "Only the team captain can delete the team" };
  }

  // Delete the team (cascade will handle members and invitations)
  await db.delete(team).where(eq(team.id, teamId));

  revalidatePath("/teams");
  return { success: true };
}
