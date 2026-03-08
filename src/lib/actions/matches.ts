"use server";

import { eq, or, inArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { match, matchScore, teamMember, team } from "@/db/competition-schema";
import { getCurrentUser } from "./auth-utils";

// ============================================================================
// Get My Matches (matches for teams the user is a member of)
// ============================================================================

export async function getMyMatches(
  filter: "upcoming" | "completed" | "all" = "all",
) {
  const currentUser = await getCurrentUser();

  // Get all teams where user is a member
  const memberships = await db.query.teamMember.findMany({
    where: eq(teamMember.userId, currentUser.id),
  });

  const teamIds = memberships.map((m) => m.teamId);

  if (teamIds.length === 0) {
    return [];
  }

  // Get all matches for these teams
  const allMatches = await db.query.match.findMany({
    where: or(
      inArray(match.homeTeamId, teamIds),
      inArray(match.awayTeamId, teamIds),
    ),
    with: {
      homeTeam: true,
      awayTeam: true,
      competition: true,
      group: true,
      score: true,
    },
    orderBy: desc(match.createdAt),
  });

  // Filter based on status
  let filteredMatches = allMatches;
  if (filter === "upcoming") {
    filteredMatches = allMatches.filter(
      (m) => m.status === "scheduled" || m.status === "in_progress",
    );
  } else if (filter === "completed") {
    filteredMatches = allMatches.filter((m) => m.status === "completed");
  }

  // Get teams where user is captain
  const captainTeams = await db.query.team.findMany({
    where: eq(team.captainUserId, currentUser.id),
  });
  const captainTeamIds = captainTeams.map((t) => t.id);

  return filteredMatches.map((m) => ({
    id: m.id,
    round: m.round,
    isKnockout: m.isKnockout,
    status: m.status,
    scheduledAt: m.scheduledAt,
    homeTeam: m.homeTeam
      ? {
          id: m.homeTeam.id,
          name: m.homeTeam.name,
        }
      : null,
    awayTeam: m.awayTeam
      ? {
          id: m.awayTeam.id,
          name: m.awayTeam.name,
        }
      : null,
    competition: {
      id: m.competition.id,
      name: m.competition.name,
      status: m.competition.status,
    },
    group: m.group
      ? {
          id: m.group.id,
          name: m.group.name,
        }
      : null,
    score: m.score
      ? {
          homeScore: m.score.homeScore,
          awayScore: m.score.awayScore,
        }
      : null,
    // User's team in this match
    myTeamId: teamIds.find((id) => id === m.homeTeamId || id === m.awayTeamId),
    isMyTeamHome: m.homeTeamId !== null && teamIds.includes(m.homeTeamId),
    // Can submit score if user is member of either team
    canSubmitScore:
      (m.competition.status === "group_stage" ||
        m.competition.status === "knockout") &&
      (m.status === "scheduled" || m.status === "in_progress"),
    // Is captain of one of the teams
    isCaptain:
      (m.homeTeamId !== null && captainTeamIds.includes(m.homeTeamId)) ||
      (m.awayTeamId !== null && captainTeamIds.includes(m.awayTeamId)),
  }));
}

// ============================================================================
// Get Match by ID
// ============================================================================

export async function getMatch(matchId: string) {
  const currentUser = await getCurrentUser();

  const matchData = await db.query.match.findFirst({
    where: eq(match.id, matchId),
    with: {
      homeTeam: {
        with: {
          members: {
            with: {
              user: true,
            },
          },
        },
      },
      awayTeam: {
        with: {
          members: {
            with: {
              user: true,
            },
          },
        },
      },
      competition: true,
      group: true,
      score: {
        with: {
          submittedBy: true,
          confirmedBy: true,
        },
      },
    },
  });

  if (!matchData) {
    return null;
  }

  // Check if user is a member of either team
  const isHomeMember =
    matchData.homeTeam?.members.some((m) => m.userId === currentUser.id) ??
    false;
  const isAwayMember =
    matchData.awayTeam?.members.some((m) => m.userId === currentUser.id) ??
    false;
  const isMember = isHomeMember || isAwayMember;

  // Check if user is captain of either team
  const isHomeCaptain = matchData.homeTeam?.captainUserId === currentUser.id;
  const isAwayCaptain = matchData.awayTeam?.captainUserId === currentUser.id;
  const isCaptain = isHomeCaptain || isAwayCaptain;

  // Determine if user can submit/update score
  const canSubmitScore =
    isMember &&
    (matchData.competition.status === "group_stage" ||
      matchData.competition.status === "knockout") &&
    (matchData.status === "scheduled" || matchData.status === "in_progress");

  return {
    id: matchData.id,
    round: matchData.round,
    isKnockout: matchData.isKnockout,
    status: matchData.status,
    scheduledAt: matchData.scheduledAt,
    createdAt: matchData.createdAt,
    homeTeam: matchData.homeTeam
      ? {
          id: matchData.homeTeam.id,
          name: matchData.homeTeam.name,
          captainUserId: matchData.homeTeam.captainUserId,
          members: matchData.homeTeam.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            username: m.user.username,
          })),
        }
      : null,
    awayTeam: matchData.awayTeam
      ? {
          id: matchData.awayTeam.id,
          name: matchData.awayTeam.name,
          captainUserId: matchData.awayTeam.captainUserId,
          members: matchData.awayTeam.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            username: m.user.username,
          })),
        }
      : null,
    competition: {
      id: matchData.competition.id,
      name: matchData.competition.name,
      status: matchData.competition.status,
    },
    group: matchData.group
      ? {
          id: matchData.group.id,
          name: matchData.group.name,
        }
      : null,
    score: matchData.score
      ? {
          homeScore: matchData.score.homeScore,
          awayScore: matchData.score.awayScore,
          submittedBy: matchData.score.submittedBy
            ? {
                id: matchData.score.submittedBy.id,
                name: matchData.score.submittedBy.name,
              }
            : null,
          submittedAt: matchData.score.submittedAt,
          confirmedBy: matchData.score.confirmedBy
            ? {
                id: matchData.score.confirmedBy.id,
                name: matchData.score.confirmedBy.name,
              }
            : null,
          confirmedAt: matchData.score.confirmedAt,
        }
      : null,
    isMember,
    isCaptain,
    isHomeMember,
    isAwayMember,
    canSubmitScore,
  };
}

// ============================================================================
// Submit Match Score (by team member)
// ============================================================================

export async function submitMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
) {
  const currentUser = await getCurrentUser();

  const matchData = await db.query.match.findFirst({
    where: eq(match.id, matchId),
    with: {
      homeTeam: {
        with: {
          members: true,
        },
      },
      awayTeam: {
        with: {
          members: true,
        },
      },
      competition: true,
      score: true,
    },
  });

  if (!matchData) {
    return { error: "Match not found" };
  }

  // Check if user is a member of either team
  const isHomeMember =
    matchData.homeTeam?.members.some((m) => m.userId === currentUser.id) ??
    false;
  const isAwayMember =
    matchData.awayTeam?.members.some((m) => m.userId === currentUser.id) ??
    false;

  if (!isHomeMember && !isAwayMember) {
    return { error: "You must be a team member to submit scores" };
  }

  // Check competition status
  if (
    matchData.competition.status !== "group_stage" &&
    matchData.competition.status !== "knockout"
  ) {
    return { error: "Scores can only be submitted during active competition" };
  }

  // Validate scores
  if (homeScore < 0 || awayScore < 0) {
    return { error: "Scores cannot be negative" };
  }

  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    return { error: "Scores must be whole numbers" };
  }

  // Petanque typically plays to 13 points
  if (homeScore > 13 && awayScore > 13) {
    return {
      error: "Invalid score: at least one team should have 13 or fewer points",
    };
  }

  if (matchData.score) {
    // Update existing score
    await db
      .update(matchScore)
      .set({
        homeScore,
        awayScore,
      })
      .where(eq(matchScore.matchId, matchId));
  } else {
    // Create new score
    await db.insert(matchScore).values({
      matchId,
      homeScore,
      awayScore,
      submittedByUserId: currentUser.id,
    });
  }

  // Update match status based on score
  // In petanque, first to 13 wins (or highest after time)
  const isComplete = homeScore === 13 || awayScore === 13;

  await db
    .update(match)
    .set({
      status: isComplete ? "completed" : "in_progress",
    })
    .where(eq(match.id, matchId));

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");
  revalidatePath(`/admin/competitions/${matchData.competitionId}`);
  return { success: true };
}

// ============================================================================
// Start Match (set status to in_progress)
// ============================================================================

export async function startMatch(matchId: string) {
  const currentUser = await getCurrentUser();

  const matchData = await db.query.match.findFirst({
    where: eq(match.id, matchId),
    with: {
      homeTeam: {
        with: {
          members: true,
        },
      },
      awayTeam: {
        with: {
          members: true,
        },
      },
      competition: true,
    },
  });

  if (!matchData) {
    return { error: "Match not found" };
  }

  // Check if user is a member of either team
  const isHomeMember =
    matchData.homeTeam?.members.some((m) => m.userId === currentUser.id) ??
    false;
  const isAwayMember =
    matchData.awayTeam?.members.some((m) => m.userId === currentUser.id) ??
    false;

  if (!isHomeMember && !isAwayMember) {
    return { error: "You must be a team member to start a match" };
  }

  if (matchData.status !== "scheduled") {
    return { error: "Match has already started or completed" };
  }

  // Check competition status
  if (
    matchData.competition.status !== "group_stage" &&
    matchData.competition.status !== "knockout"
  ) {
    return { error: "Competition is not in an active phase" };
  }

  await db
    .update(match)
    .set({ status: "in_progress" })
    .where(eq(match.id, matchId));

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");
  return { success: true };
}

// ============================================================================
// Complete Match (finalize score)
// ============================================================================

export async function completeMatch(matchId: string) {
  const currentUser = await getCurrentUser();

  const matchData = await db.query.match.findFirst({
    where: eq(match.id, matchId),
    with: {
      homeTeam: {
        with: {
          members: true,
        },
      },
      awayTeam: {
        with: {
          members: true,
        },
      },
      score: true,
    },
  });

  if (!matchData) {
    return { error: "Match not found" };
  }

  // Check if user is a member of either team
  const isHomeMember =
    matchData.homeTeam?.members.some((m) => m.userId === currentUser.id) ??
    false;
  const isAwayMember =
    matchData.awayTeam?.members.some((m) => m.userId === currentUser.id) ??
    false;

  if (!isHomeMember && !isAwayMember) {
    return { error: "You must be a team member to complete a match" };
  }

  if (!matchData.score) {
    return { error: "Cannot complete match without a score" };
  }

  if (matchData.status === "completed") {
    return { error: "Match is already completed" };
  }

  await db
    .update(match)
    .set({ status: "completed" })
    .where(eq(match.id, matchId));

  // Mark score as confirmed
  await db
    .update(matchScore)
    .set({
      confirmedByUserId: currentUser.id,
      confirmedAt: new Date(),
    })
    .where(eq(matchScore.matchId, matchId));

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");
  revalidatePath(`/admin/competitions/${matchData.competitionId}`);
  return { success: true };
}

// ============================================================================
// Get Match History (all completed matches for user's teams)
// ============================================================================

export async function getMatchHistory() {
  return getMyMatches("completed");
}

// ============================================================================
// Get Upcoming Matches
// ============================================================================

export async function getUpcomingMatches() {
  return getMyMatches("upcoming");
}
