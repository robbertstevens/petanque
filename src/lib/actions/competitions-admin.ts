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
  const byes = bracketSize - qualifiedTeams.length;

  const shuffled = [...qualifiedTeams].sort(() => Math.random() - 0.5);

  const firstRoundMatches: { homeTeamId: string; awayTeamId: string }[] = [];
  let teamIndex = 0;

  for (let i = 0; i < bracketSize / 2; i++) {
    if (i < byes) {
      teamIndex++;
    } else {
      const home = shuffled[teamIndex++];
      const away = shuffled[teamIndex++];
      if (home && away) {
        firstRoundMatches.push({ homeTeamId: home, awayTeamId: away });
      }
    }
  }

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

function calculateGroupStandings(grp: {
  competitionTeams: { teamId: string }[];
  matches: {
    homeTeamId: string;
    awayTeamId: string;
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
