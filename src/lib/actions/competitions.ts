"use server";

import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import {
  competition,
  group,
  competitionTeam,
  match,
  matchScore,
  userRole,
  team,
  teamMember,
} from "@/db/competition-schema";
import { auth } from "@/lib/auth";

// ============================================================================
// Helper: Get current user from session
// ============================================================================

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

// ============================================================================
// Helper: Check if user is admin
// ============================================================================

export async function isCurrentUserAdmin(): Promise<boolean> {
  const currentUser = await getCurrentUser();

  const role = await db.query.userRole.findFirst({
    where: and(eq(userRole.userId, currentUser.id), eq(userRole.role, "admin")),
  });

  return !!role;
}

async function requireAdmin() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error("Admin access required");
  }
  return getCurrentUser();
}

// ============================================================================
// Create Competition
// ============================================================================

export async function createCompetition(formData: FormData) {
  const currentUser = await requireAdmin();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const teamSize = parseInt(formData.get("teamSize") as string, 10);
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;

  if (!name || name.trim().length === 0) {
    return { error: "Competition name is required" };
  }

  if (name.trim().length < 3) {
    return { error: "Competition name must be at least 3 characters" };
  }

  if (isNaN(teamSize) || teamSize < 2 || teamSize > 3) {
    return { error: "Team size must be 2 or 3" };
  }

  const startDate = startDateStr ? new Date(startDateStr) : null;
  const endDate = endDateStr ? new Date(endDateStr) : null;

  if (startDate && endDate && startDate > endDate) {
    return { error: "End date must be after start date" };
  }

  const [newCompetition] = await db
    .insert(competition)
    .values({
      name: name.trim(),
      description: description?.trim() || null,
      teamSize,
      startDate,
      endDate,
      createdByUserId: currentUser.id,
      status: "draft",
    })
    .returning();

  revalidatePath("/admin/competitions");
  return { success: true, competitionId: newCompetition.id };
}

// ============================================================================
// Get All Competitions (Admin)
// ============================================================================

export async function getCompetitions() {
  await requireAdmin();

  const competitions = await db.query.competition.findMany({
    orderBy: desc(competition.createdAt),
    with: {
      competitionTeams: true,
      groups: true,
    },
  });

  return competitions.map((c) => ({
    ...c,
    teamCount: c.competitionTeams.length,
    groupCount: c.groups.length,
  }));
}

// ============================================================================
// Get Competition by ID (Admin)
// ============================================================================

export async function getCompetition(competitionId: string) {
  await requireAdmin();

  const comp = await db.query.competition.findFirst({
    where: eq(competition.id, competitionId),
    with: {
      createdBy: true,
      groups: {
        with: {
          competitionTeams: {
            with: {
              team: true,
            },
          },
          matches: {
            with: {
              homeTeam: true,
              awayTeam: true,
              score: true,
            },
          },
        },
      },
      competitionTeams: {
        with: {
          team: {
            with: {
              members: {
                with: {
                  user: true,
                },
              },
            },
          },
        },
      },
      matches: {
        with: {
          homeTeam: true,
          awayTeam: true,
          score: true,
        },
      },
    },
  });

  return comp;
}

// ============================================================================
// Update Competition Status
// ============================================================================

export async function updateCompetitionStatus(
  competitionId: string,
  newStatus:
    | "draft"
    | "registration"
    | "group_stage"
    | "knockout"
    | "completed",
) {
  await requireAdmin();

  const comp = await db.query.competition.findFirst({
    where: eq(competition.id, competitionId),
  });

  if (!comp) {
    return { error: "Competition not found" };
  }

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    draft: ["registration"],
    registration: ["draft", "group_stage"],
    group_stage: ["knockout", "completed"],
    knockout: ["completed"],
    completed: [],
  };

  if (!validTransitions[comp.status]?.includes(newStatus)) {
    return { error: `Cannot transition from ${comp.status} to ${newStatus}` };
  }

  await db
    .update(competition)
    .set({ status: newStatus })
    .where(eq(competition.id, competitionId));

  revalidatePath(`/admin/competitions/${competitionId}`);
  revalidatePath("/admin/competitions");
  return { success: true };
}

// ============================================================================
// Create Group
// ============================================================================

export async function createGroup(competitionId: string, formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;

  if (!name || name.trim().length === 0) {
    return { error: "Group name is required" };
  }

  // Check competition exists
  const comp = await db.query.competition.findFirst({
    where: eq(competition.id, competitionId),
  });

  if (!comp) {
    return { error: "Competition not found" };
  }

  await db.insert(group).values({
    competitionId,
    name: name.trim(),
  });

  revalidatePath(`/admin/competitions/${competitionId}`);
  return { success: true };
}

// ============================================================================
// Update Group
// ============================================================================

export async function updateGroup(groupId: string, formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;

  if (!name || name.trim().length === 0) {
    return { error: "Group name is required" };
  }

  const grp = await db.query.group.findFirst({
    where: eq(group.id, groupId),
  });

  if (!grp) {
    return { error: "Group not found" };
  }

  await db
    .update(group)
    .set({ name: name.trim() })
    .where(eq(group.id, groupId));

  revalidatePath(`/admin/competitions/${grp.competitionId}`);
  return { success: true };
}

// ============================================================================
// Delete Group
// ============================================================================

export async function deleteGroup(groupId: string) {
  await requireAdmin();

  const grp = await db.query.group.findFirst({
    where: eq(group.id, groupId),
    with: {
      competitionTeams: true,
      matches: true,
    },
  });

  if (!grp) {
    return { error: "Group not found" };
  }

  if (grp.competitionTeams.length > 0) {
    return { error: "Cannot delete group with assigned teams" };
  }

  if (grp.matches.length > 0) {
    return { error: "Cannot delete group with existing matches" };
  }

  await db.delete(group).where(eq(group.id, groupId));

  revalidatePath(`/admin/competitions/${grp.competitionId}`);
  return { success: true };
}

// ============================================================================
// Assign Team to Group
// ============================================================================

export async function assignTeamToGroup(
  competitionTeamId: string,
  groupId: string | null,
) {
  await requireAdmin();

  const compTeam = await db.query.competitionTeam.findFirst({
    where: eq(competitionTeam.id, competitionTeamId),
  });

  if (!compTeam) {
    return { error: "Competition team not found" };
  }

  // Validate group belongs to same competition
  if (groupId) {
    const grp = await db.query.group.findFirst({
      where: eq(group.id, groupId),
    });

    if (!grp || grp.competitionId !== compTeam.competitionId) {
      return { error: "Invalid group" };
    }
  }

  await db
    .update(competitionTeam)
    .set({ groupId })
    .where(eq(competitionTeam.id, competitionTeamId));

  revalidatePath(`/admin/competitions/${compTeam.competitionId}`);
  return { success: true };
}

// ============================================================================
// Generate Round-Robin Schedule for a Group
// ============================================================================

export async function generateGroupSchedule(groupId: string) {
  await requireAdmin();

  const grp = await db.query.group.findFirst({
    where: eq(group.id, groupId),
    with: {
      competitionTeams: {
        with: {
          team: true,
        },
      },
      matches: true,
    },
  });

  if (!grp) {
    return { error: "Group not found" };
  }

  if (grp.matches.length > 0) {
    return { error: "Schedule already exists for this group" };
  }

  const teams = grp.competitionTeams;
  if (teams.length < 2) {
    return { error: "Need at least 2 teams to generate schedule" };
  }

  // Generate round-robin pairings
  const matches: { homeTeamId: string; awayTeamId: string; round: number }[] =
    [];

  // Round-robin algorithm
  const teamIds = teams.map((t) => t.teamId);
  const n = teamIds.length;

  // If odd number of teams, add a "bye" placeholder
  const hasbye = n % 2 === 1;
  const teamList = hasbye ? [...teamIds, "BYE"] : [...teamIds];
  const numTeams = teamList.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < matchesPerRound; i++) {
      const home = teamList[i];
      const away = teamList[numTeams - 1 - i];

      // Skip bye matches
      if (home !== "BYE" && away !== "BYE") {
        matches.push({
          homeTeamId: home,
          awayTeamId: away,
          round: round + 1,
        });
      }
    }

    // Rotate teams (keep first team fixed)
    const last = teamList.pop()!;
    teamList.splice(1, 0, last);
  }

  // Insert all matches
  await db.insert(match).values(
    matches.map((m) => ({
      competitionId: grp.competitionId,
      groupId: grp.id,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      round: m.round,
      isKnockout: false,
      status: "scheduled" as const,
    })),
  );

  revalidatePath(`/admin/competitions/${grp.competitionId}`);
  return { success: true, matchCount: matches.length };
}

// ============================================================================
// Generate Knockout Bracket
// ============================================================================

export async function generateKnockoutBracket(competitionId: string) {
  await requireAdmin();

  const comp = await db.query.competition.findFirst({
    where: eq(competition.id, competitionId),
    with: {
      groups: {
        with: {
          competitionTeams: true,
          matches: {
            with: {
              score: true,
            },
          },
        },
      },
      matches: {
        where: eq(match.isKnockout, true),
      },
    },
  });

  if (!comp) {
    return { error: "Competition not found" };
  }

  if (comp.matches.length > 0) {
    return { error: "Knockout bracket already exists" };
  }

  // Calculate standings for each group and get top teams
  const qualifiedTeams: string[] = [];

  for (const grp of comp.groups) {
    const standings = calculateGroupStandings(grp);
    // Top 2 from each group qualify (or top 1 if small group)
    const qualifyCount = Math.min(2, standings.length);
    for (let i = 0; i < qualifyCount; i++) {
      qualifiedTeams.push(standings[i].teamId);
    }
  }

  if (qualifiedTeams.length < 2) {
    return { error: "Need at least 2 qualified teams for knockout" };
  }

  // Generate bracket (simple single elimination)
  // Round to nearest power of 2
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(qualifiedTeams.length)));
  const byes = bracketSize - qualifiedTeams.length;

  // Shuffle teams for seeding (in real app, would seed by group position)
  const shuffled = [...qualifiedTeams].sort(() => Math.random() - 0.5);

  // Create first round matches
  const firstRoundMatches: { homeTeamId: string; awayTeamId: string }[] = [];
  let teamIndex = 0;

  for (let i = 0; i < bracketSize / 2; i++) {
    if (i < byes) {
      // This slot gets a bye - team advances automatically
      // We'll handle this by not creating a match for them in first round
      teamIndex++;
    } else {
      const home = shuffled[teamIndex++];
      const away = shuffled[teamIndex++];
      if (home && away) {
        firstRoundMatches.push({ homeTeamId: home, awayTeamId: away });
      }
    }
  }

  // Insert knockout matches
  if (firstRoundMatches.length > 0) {
    await db.insert(match).values(
      firstRoundMatches.map((m) => ({
        competitionId,
        groupId: null,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        round: 1,
        isKnockout: true,
        status: "scheduled" as const,
      })),
    );
  }

  revalidatePath(`/admin/competitions/${competitionId}`);
  return { success: true, matchCount: firstRoundMatches.length };
}

// ============================================================================
// Standing Types (exported for use in components)
// ============================================================================

export type TeamStanding = {
  teamId: string;
  teamName: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  played: number;
  scored: number;
  conceded: number;
  difference: number;
};

export type GroupStandings = {
  groupId: string;
  groupName: string;
  standings: TeamStanding[];
};

// Helper function to calculate group standings
function calculateGroupStandings(grp: {
  competitionTeams: { teamId: string }[];
  matches: {
    homeTeamId: string;
    awayTeamId: string;
    score: { homeScore: number; awayScore: number } | null;
  }[];
}) {
  const standings: Map<
    string,
    {
      teamId: string;
      points: number;
      wins: number;
      losses: number;
      draws: number;
      scored: number;
      conceded: number;
    }
  > = new Map();

  // Initialize standings
  for (const ct of grp.competitionTeams) {
    standings.set(ct.teamId, {
      teamId: ct.teamId,
      points: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      scored: 0,
      conceded: 0,
    });
  }

  // Calculate from completed matches
  for (const m of grp.matches) {
    if (!m.score) continue;

    const home = standings.get(m.homeTeamId);
    const away = standings.get(m.awayTeamId);

    if (!home || !away) continue;

    home.scored += m.score.homeScore;
    home.conceded += m.score.awayScore;
    away.scored += m.score.awayScore;
    away.conceded += m.score.homeScore;

    if (m.score.homeScore > m.score.awayScore) {
      home.wins++;
      home.points += 3;
      away.losses++;
    } else if (m.score.homeScore < m.score.awayScore) {
      away.wins++;
      away.points += 3;
      home.losses++;
    } else {
      home.draws++;
      away.draws++;
      home.points += 1;
      away.points += 1;
    }
  }

  // Sort by points, then goal difference, then goals scored
  return Array.from(standings.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffA = a.scored - a.conceded;
    const diffB = b.scored - b.conceded;
    if (diffB !== diffA) return diffB - diffA;
    return b.scored - a.scored;
  });
}

// ============================================================================
// Update Match Score (Admin Override)
// ============================================================================

export async function updateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
) {
  const currentUser = await requireAdmin();

  const matchData = await db.query.match.findFirst({
    where: eq(match.id, matchId),
    with: {
      score: true,
    },
  });

  if (!matchData) {
    return { error: "Match not found" };
  }

  if (homeScore < 0 || awayScore < 0) {
    return { error: "Scores cannot be negative" };
  }

  if (matchData.score) {
    // Update existing score
    await db
      .update(matchScore)
      .set({
        homeScore,
        awayScore,
        confirmedByUserId: currentUser.id,
        confirmedAt: new Date(),
      })
      .where(eq(matchScore.matchId, matchId));
  } else {
    // Create new score
    await db.insert(matchScore).values({
      matchId,
      homeScore,
      awayScore,
      submittedByUserId: currentUser.id,
      confirmedByUserId: currentUser.id,
      confirmedAt: new Date(),
    });
  }

  // Update match status to completed
  await db
    .update(match)
    .set({ status: "completed" })
    .where(eq(match.id, matchId));

  revalidatePath(`/admin/competitions/${matchData.competitionId}`);
  return { success: true };
}

// ============================================================================
// Delete Competition
// ============================================================================

export async function deleteCompetition(competitionId: string) {
  await requireAdmin();

  const comp = await db.query.competition.findFirst({
    where: eq(competition.id, competitionId),
  });

  if (!comp) {
    return { error: "Competition not found" };
  }

  if (comp.status !== "draft") {
    return { error: "Can only delete competitions in draft status" };
  }

  await db.delete(competition).where(eq(competition.id, competitionId));

  revalidatePath("/admin/competitions");
  return { success: true };
}

// ============================================================================
// USER-FACING: Get Available Competitions (Registration Phase)
// ============================================================================

export async function getAvailableCompetitions() {
  await getCurrentUser(); // Ensure authenticated

  const competitions = await db.query.competition.findMany({
    where: eq(competition.status, "registration"),
    orderBy: desc(competition.createdAt),
    with: {
      competitionTeams: true,
    },
  });

  return competitions.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    teamSize: c.teamSize,
    startDate: c.startDate,
    endDate: c.endDate,
    status: c.status,
    registeredTeamCount: c.competitionTeams.length,
  }));
}

// ============================================================================
// USER-FACING: Get Competition by ID (Public View)
// ============================================================================

export async function getCompetitionForUser(competitionId: string) {
  await getCurrentUser(); // Ensure authenticated

  const comp = await db.query.competition.findFirst({
    where: eq(competition.id, competitionId),
    with: {
      competitionTeams: {
        with: {
          team: true,
        },
      },
    },
  });

  if (!comp) {
    return null;
  }

  return {
    id: comp.id,
    name: comp.name,
    description: comp.description,
    teamSize: comp.teamSize,
    startDate: comp.startDate,
    endDate: comp.endDate,
    status: comp.status,
    registeredTeams: comp.competitionTeams.map((ct) => ({
      id: ct.id,
      teamId: ct.team.id,
      teamName: ct.team.name,
      registeredAt: ct.registeredAt,
    })),
  };
}

// ============================================================================
// USER-FACING: Get User's Teams Where They Are Captain
// ============================================================================

export async function getMyTeamsAsCaptain() {
  const currentUser = await getCurrentUser();

  const teams = await db.query.team.findMany({
    where: eq(team.captainUserId, currentUser.id),
    with: {
      members: true,
      competitionTeams: true,
    },
  });

  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    memberCount: t.members.length,
    registeredCompetitionIds: t.competitionTeams.map((ct) => ct.competitionId),
  }));
}

// ============================================================================
// USER-FACING: Register Team for Competition
// ============================================================================

export async function registerTeamForCompetition(
  competitionId: string,
  teamId: string,
) {
  const currentUser = await getCurrentUser();

  // Get competition
  const comp = await db.query.competition.findFirst({
    where: eq(competition.id, competitionId),
  });

  if (!comp) {
    return { error: "Competition not found" };
  }

  if (comp.status !== "registration") {
    return { error: "Registration is not open for this competition" };
  }

  // Get team and verify captain
  const teamData = await db.query.team.findFirst({
    where: eq(team.id, teamId),
    with: {
      members: true,
    },
  });

  if (!teamData) {
    return { error: "Team not found" };
  }

  if (teamData.captainUserId !== currentUser.id) {
    return { error: "Only the team captain can register the team" };
  }

  // Check team has enough members
  if (teamData.members.length < comp.teamSize) {
    return {
      error: `Team must have at least ${comp.teamSize} members to register`,
    };
  }

  // Check if team is already registered
  const existingRegistration = await db.query.competitionTeam.findFirst({
    where: and(
      eq(competitionTeam.competitionId, competitionId),
      eq(competitionTeam.teamId, teamId),
    ),
  });

  if (existingRegistration) {
    return { error: "Team is already registered for this competition" };
  }

  // Register the team
  await db.insert(competitionTeam).values({
    competitionId,
    teamId,
  });

  revalidatePath(`/competitions/${competitionId}`);
  revalidatePath("/competitions/my");
  revalidatePath(`/admin/competitions/${competitionId}`);
  return { success: true };
}

// ============================================================================
// USER-FACING: Withdraw Team from Competition
// ============================================================================

export async function withdrawTeamFromCompetition(
  competitionId: string,
  teamId: string,
) {
  const currentUser = await getCurrentUser();

  // Get competition
  const comp = await db.query.competition.findFirst({
    where: eq(competition.id, competitionId),
  });

  if (!comp) {
    return { error: "Competition not found" };
  }

  if (comp.status !== "registration") {
    return { error: "Can only withdraw during registration phase" };
  }

  // Get team and verify captain
  const teamData = await db.query.team.findFirst({
    where: eq(team.id, teamId),
  });

  if (!teamData) {
    return { error: "Team not found" };
  }

  if (teamData.captainUserId !== currentUser.id) {
    return { error: "Only the team captain can withdraw the team" };
  }

  // Find and delete the registration
  const registration = await db.query.competitionTeam.findFirst({
    where: and(
      eq(competitionTeam.competitionId, competitionId),
      eq(competitionTeam.teamId, teamId),
    ),
  });

  if (!registration) {
    return { error: "Team is not registered for this competition" };
  }

  await db
    .delete(competitionTeam)
    .where(eq(competitionTeam.id, registration.id));

  revalidatePath(`/competitions/${competitionId}`);
  revalidatePath("/competitions/my");
  revalidatePath(`/admin/competitions/${competitionId}`);
  return { success: true };
}

// ============================================================================
// USER-FACING: Get My Competitions (Where User's Teams Are Registered)
// ============================================================================

export async function getMyCompetitions() {
  const currentUser = await getCurrentUser();

  // Get all teams where user is a member
  const memberships = await db.query.teamMember.findMany({
    where: eq(teamMember.userId, currentUser.id),
  });

  const teamIds = memberships.map((m) => m.teamId);

  if (teamIds.length === 0) {
    return [];
  }

  // Get all competition registrations for these teams
  const registrations = await db.query.competitionTeam.findMany({
    with: {
      competition: true,
      team: true,
    },
  });

  // Filter to only include teams the user is a member of
  const myRegistrations = registrations.filter((r) =>
    teamIds.includes(r.teamId),
  );

  // Get captain info to check if user is captain
  const teamsWithCaptainInfo = await db.query.team.findMany({
    where: eq(team.captainUserId, currentUser.id),
  });
  const captainTeamIds = teamsWithCaptainInfo.map((t) => t.id);

  return myRegistrations.map((r) => ({
    registrationId: r.id,
    competitionId: r.competition.id,
    competitionName: r.competition.name,
    competitionStatus: r.competition.status,
    competitionStartDate: r.competition.startDate,
    competitionEndDate: r.competition.endDate,
    teamId: r.team.id,
    teamName: r.team.name,
    registeredAt: r.registeredAt,
    isCaptain: captainTeamIds.includes(r.teamId),
    canWithdraw:
      r.competition.status === "registration" &&
      captainTeamIds.includes(r.teamId),
  }));
}

// ============================================================================
// Make User Admin (for initial setup)
// ============================================================================

export async function makeUserAdmin(userId: string) {
  // This should be protected or removed in production
  // For now, allow any authenticated user to become admin for testing
  // Verify user is authenticated
  await getCurrentUser();

  // Check if already admin
  const existingRole = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  });

  if (existingRole) {
    return { error: "User already has a role" };
  }

  await db.insert(userRole).values({
    userId,
    role: "admin",
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true };
}

// ============================================================================
// USER-FACING: Get Competition Standings (Groups + Knockout)
// ============================================================================

export async function getCompetitionStandings(competitionId: string) {
  await getCurrentUser(); // Ensure authenticated

  const comp = await db.query.competition.findFirst({
    where: eq(competition.id, competitionId),
    with: {
      groups: {
        with: {
          competitionTeams: {
            with: {
              team: true,
            },
          },
          matches: {
            with: {
              homeTeam: true,
              awayTeam: true,
              score: true,
            },
          },
        },
      },
      matches: {
        with: {
          homeTeam: true,
          awayTeam: true,
          score: true,
        },
      },
    },
  });

  if (!comp) {
    return null;
  }

  // Don't show standings for draft competitions
  if (comp.status === "draft") {
    return null;
  }

  // Calculate standings for each group
  const groupStandings: GroupStandings[] = comp.groups.map((grp) => {
    const rawStandings = calculateGroupStandings(grp);
    const teamMap = new Map(
      grp.competitionTeams.map((ct) => [ct.teamId, ct.team.name]),
    );

    return {
      groupId: grp.id,
      groupName: grp.name,
      standings: rawStandings.map((s) => ({
        teamId: s.teamId,
        teamName: teamMap.get(s.teamId) || "Unknown",
        points: s.points,
        wins: s.wins,
        losses: s.losses,
        draws: s.draws,
        played: s.wins + s.losses + s.draws,
        scored: s.scored,
        conceded: s.conceded,
        difference: s.scored - s.conceded,
      })),
    };
  });

  // Get knockout matches
  const knockoutMatches = comp.matches
    .filter((m) => m.isKnockout)
    .map((m) => ({
      id: m.id,
      round: m.round,
      homeTeamId: m.homeTeamId,
      homeTeamName: m.homeTeam.name,
      awayTeamId: m.awayTeamId,
      awayTeamName: m.awayTeam.name,
      status: m.status,
      homeScore: m.score?.homeScore ?? null,
      awayScore: m.score?.awayScore ?? null,
      winnerId:
        m.score && m.status === "completed"
          ? m.score.homeScore > m.score.awayScore
            ? m.homeTeamId
            : m.awayTeamId
          : null,
    }))
    .sort((a, b) => a.round - b.round);

  return {
    id: comp.id,
    name: comp.name,
    description: comp.description,
    status: comp.status,
    startDate: comp.startDate,
    endDate: comp.endDate,
    groupStandings,
    knockoutMatches,
  };
}

// ============================================================================
// USER-FACING: Get Completed Competitions (Archive)
// ============================================================================

export async function getCompletedCompetitions() {
  await getCurrentUser(); // Ensure authenticated

  const competitions = await db.query.competition.findMany({
    where: eq(competition.status, "completed"),
    orderBy: desc(competition.endDate),
    with: {
      competitionTeams: {
        with: {
          team: true,
        },
      },
    },
  });

  return competitions.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    teamSize: c.teamSize,
    startDate: c.startDate,
    endDate: c.endDate,
    teamCount: c.competitionTeams.length,
  }));
}

// ============================================================================
// USER-FACING: Get Active Competitions (In Progress)
// ============================================================================

export async function getActiveCompetitions() {
  await getCurrentUser(); // Ensure authenticated

  const competitions = await db.query.competition.findMany({
    orderBy: desc(competition.createdAt),
    with: {
      competitionTeams: true,
    },
  });

  // Filter to only show non-draft competitions
  return competitions
    .filter((c) => c.status !== "draft")
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      teamSize: c.teamSize,
      startDate: c.startDate,
      endDate: c.endDate,
      status: c.status,
      teamCount: c.competitionTeams.length,
    }));
}
