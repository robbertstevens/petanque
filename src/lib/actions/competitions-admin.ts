"use server";

import { eq, and, or, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  competition,
  group,
  competitionTeam,
  match,
  matchScore,
  userRole,
} from "@/db/competition-schema";
import { getCurrentUser } from "./auth-utils";

async function requireAdmin() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error("Admin access required");
  }
  return getCurrentUser();
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const currentUser = await getCurrentUser();

  const role = await db.query.userRole.findFirst({
    where: and(
      eq(userRole.userId, currentUser.id),
      or(eq(userRole.role, "admin"), eq(userRole.role, "super_admin")),
    ),
  });

  return !!role;
}

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

export async function getAllCompetitions() {
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

export async function getCompetitionAdmin(competitionId: string) {
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

export async function createGroup(competitionId: string, formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;

  if (!name || name.trim().length === 0) {
    return { error: "Group name is required" };
  }

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

  const matches: { homeTeamId: string; awayTeamId: string; round: number }[] =
    [];

  const teamIds = teams.map((t) => t.teamId);
  const n = teamIds.length;

  const hasBye = n % 2 === 1;
  const teamList = hasBye ? [...teamIds, "BYE"] : [...teamIds];
  const numTeams = teamList.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < matchesPerRound; i++) {
      const home = teamList[i];
      const away = teamList[numTeams - 1 - i];

      if (home !== "BYE" && away !== "BYE") {
        matches.push({
          homeTeamId: home,
          awayTeamId: away,
          round: round + 1,
        });
      }
    }

    const last = teamList.pop()!;
    teamList.splice(1, 0, last);
  }

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

  const qualifiedTeams: string[] = [];

  for (const grp of comp.groups) {
    const standings = calculateGroupStandings(grp);
    const qualifyCount = Math.min(2, standings.length);
    for (let i = 0; i < qualifyCount; i++) {
      qualifiedTeams.push(standings[i].teamId);
    }
  }

  if (qualifiedTeams.length < 2) {
    return { error: "Need at least 2 qualified teams for knockout" };
  }

  const bracketSize = Math.pow(2, Math.ceil(Math.log2(qualifiedTeams.length)));
  const totalRounds = Math.log2(bracketSize);
  const byes = bracketSize - qualifiedTeams.length;

  const shuffled = [...qualifiedTeams].sort(() => Math.random() - 0.5);

  // Generate all rounds
  const allMatches: {
    id: string;
    competitionId: string;
    groupId: null;
    homeTeamId: string | null;
    awayTeamId: string | null;
    round: number;
    isKnockout: true;
    status: "scheduled";
  }[] = [];

  // Round 1: First round with actual matchups
  const round1Matches: {
    homeTeamId: string | null;
    awayTeamId: string | null;
  }[] = [];
  let teamIndex = 0;

  for (let i = 0; i < bracketSize / 2; i++) {
    if (i < byes) {
      // Team gets a bye - they'll be placed in round 2
      teamIndex++;
    } else {
      const home = shuffled[teamIndex++] ?? null;
      const away = shuffled[teamIndex++] ?? null;
      round1Matches.push({ homeTeamId: home, awayTeamId: away });
    }
  }

  // Generate subsequent rounds with TBH placeholders
  const rounds: { homeTeamId: string | null; awayTeamId: string | null }[][] = [
    round1Matches,
  ];

  for (let round = 2; round <= totalRounds; round++) {
    const prevRoundMatchCount = rounds[round - 2].length;
    const currentRoundMatches: {
      homeTeamId: string | null;
      awayTeamId: string | null;
    }[] = [];

    for (let i = 0; i < prevRoundMatchCount / 2; i++) {
      currentRoundMatches.push({ homeTeamId: null, awayTeamId: null });
    }

    rounds.push(currentRoundMatches);
  }

  // Handle byes - place teams with byes directly into round 2
  for (let i = 0; i < byes; i++) {
    const byeTeam = shuffled[i];
    if (byeTeam && rounds.length > 1) {
      const round2MatchIndex = Math.floor(i / 2);
      const isHomeSlot = i % 2 === 0;

      if (rounds[1][round2MatchIndex]) {
        if (isHomeSlot) {
          rounds[1][round2MatchIndex].homeTeamId = byeTeam;
        } else {
          rounds[1][round2MatchIndex].awayTeamId = byeTeam;
        }
      }
    }
  }

  // Insert all matches
  for (let roundNum = 1; roundNum <= rounds.length; roundNum++) {
    const roundMatches = rounds[roundNum - 1];
    for (const matchData of roundMatches) {
      allMatches.push({
        id: crypto.randomUUID(),
        competitionId,
        groupId: null,
        homeTeamId: matchData.homeTeamId,
        awayTeamId: matchData.awayTeamId,
        round: roundNum,
        isKnockout: true,
        status: "scheduled",
      });
    }
  }

  if (allMatches.length > 0) {
    await db.insert(match).values(allMatches);
  }

  revalidatePath(`/admin/competitions/${competitionId}`);
  return { success: true, matchCount: allMatches.length };
}

function calculateGroupStandings(grp: {
  competitionTeams: { teamId: string }[];
  matches: {
    homeTeamId: string | null;
    awayTeamId: string | null;
    score: { homeScore: number; awayScore: number } | null;
  }[];
}) {
  const standings = new Map<
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
  >();

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

  for (const m of grp.matches) {
    if (!m.score) continue;
    if (!m.homeTeamId || !m.awayTeamId) continue;

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

  return Array.from(standings.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffA = a.scored - a.conceded;
    const diffB = b.scored - b.conceded;
    if (diffB !== diffA) return diffB - diffA;
    return b.scored - a.scored;
  });
}

async function advanceKnockoutWinner(
  competitionId: string,
  matchId: string,
  winnerId: string,
) {
  const completedMatch = await db.query.match.findFirst({
    where: eq(match.id, matchId),
  });

  if (!completedMatch || !completedMatch.isKnockout) return;

  const currentRound = completedMatch.round;
  const nextRound = currentRound + 1;

  // Find all matches in the next round
  const nextRoundMatches = await db.query.match.findMany({
    where: and(
      eq(match.competitionId, competitionId),
      eq(match.isKnockout, true),
      eq(match.round, nextRound),
    ),
    orderBy: match.id,
  });

  if (nextRoundMatches.length === 0) return; // No next round (this was the final)

  // Calculate which match in the next round this winner should go to
  // Round 1 matches: 0, 1, 2, 3... map to Round 2 matches: 0, 0, 1, 1...
  const allCurrentRoundMatches = await db.query.match.findMany({
    where: and(
      eq(match.competitionId, competitionId),
      eq(match.isKnockout, true),
      eq(match.round, currentRound),
    ),
    orderBy: match.id,
  });

  const matchIndexInRound = allCurrentRoundMatches.findIndex(
    (m) => m.id === matchId,
  );
  if (matchIndexInRound === -1) return;

  const nextRoundMatchIndex = Math.floor(matchIndexInRound / 2);
  const isHomeSlot = matchIndexInRound % 2 === 0;

  const nextMatch = nextRoundMatches[nextRoundMatchIndex];
  if (!nextMatch) return;

  // Update the next match with the winner
  if (isHomeSlot) {
    await db
      .update(match)
      .set({ homeTeamId: winnerId })
      .where(eq(match.id, nextMatch.id));
  } else {
    await db
      .update(match)
      .set({ awayTeamId: winnerId })
      .where(eq(match.id, nextMatch.id));
  }

  // If both teams are now set, ensure the match is scheduled
  const updatedMatch = await db.query.match.findFirst({
    where: eq(match.id, nextMatch.id),
  });

  if (updatedMatch?.homeTeamId && updatedMatch?.awayTeamId) {
    await db
      .update(match)
      .set({ status: "scheduled" })
      .where(eq(match.id, nextMatch.id));
  }
}

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
    await db.insert(matchScore).values({
      matchId,
      homeScore,
      awayScore,
      submittedByUserId: currentUser.id,
      confirmedByUserId: currentUser.id,
      confirmedAt: new Date(),
    });
  }

  await db
    .update(match)
    .set({ status: "completed" })
    .where(eq(match.id, matchId));

  // For knockout matches, advance the winner to the next round
  if (matchData.isKnockout && matchData.homeTeamId && matchData.awayTeamId) {
    const winnerId =
      homeScore > awayScore ? matchData.homeTeamId : matchData.awayTeamId;
    await advanceKnockoutWinner(matchData.competitionId, matchId, winnerId);
  }

  revalidatePath(`/admin/competitions/${matchData.competitionId}`);
  return { success: true };
}

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
