"use server";

import { eq, and, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  competition,
  competitionTeam,
  match,
  team,
  teamMember,
} from "@/db/competition-schema";

export type GroupStandings = {
  groupId: string;
  groupName: string;
  standings: TeamStanding[];
};

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
import { getCurrentUser } from "./auth-utils";

export async function getCompetitionsByStatus(
  status:
    | "registration"
    | "group_stage"
    | "knockout"
    | "completed"
    | "all-active",
) {
  const whereClause =
    status === "all-active"
      ? inArray(competition.status, ["registration", "group_stage", "knockout"])
      : eq(competition.status, status);

  const competitions = await db.query.competition.findMany({
    where: whereClause,
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

export async function getCompetition(competitionId: string) {
  await getCurrentUser();

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

export async function getCompetitionMatches(competitionId: string) {
  await getCurrentUser();

  const comp = await db.query.competition.findFirst({
    where: eq(competition.id, competitionId),
  });

  if (!comp) {
    return null;
  }

  const matches = await db.query.match.findMany({
    where: eq(match.competitionId, competitionId),
    with: {
      homeTeam: true,
      awayTeam: true,
      group: true,
      score: true,
    },
    orderBy: [desc(match.round), match.createdAt],
  });

  const upcomingMatches = matches.filter(
    (m) => m.status === "scheduled" || m.status === "in_progress",
  );
  const completedMatches = matches.filter((m) => m.status === "completed");

  return {
    upcoming: upcomingMatches.map((m) => ({
      id: m.id,
      round: m.round,
      isKnockout: m.isKnockout,
      status: m.status,
      scheduledAt: m.scheduledAt,
      homeTeam: {
        id: m.homeTeam.id,
        name: m.homeTeam.name,
      },
      awayTeam: {
        id: m.awayTeam.id,
        name: m.awayTeam.name,
      },
      group: m.group
        ? {
            id: m.group.id,
            name: m.group.name,
          }
        : null,
      score: null,
    })),
    completed: completedMatches.map((m) => ({
      id: m.id,
      round: m.round,
      isKnockout: m.isKnockout,
      status: m.status,
      scheduledAt: m.scheduledAt,
      homeTeam: {
        id: m.homeTeam.id,
        name: m.homeTeam.name,
      },
      awayTeam: {
        id: m.awayTeam.id,
        name: m.awayTeam.name,
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
    })),
  };
}

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

export async function registerTeamForCompetition(
  competitionId: string,
  teamId: string,
) {
  const currentUser = await getCurrentUser();

  const comp = await db.query.competition.findFirst({
    where: eq(competition.id, competitionId),
  });

  if (!comp) {
    return { error: "Competition not found" };
  }

  if (comp.status !== "registration") {
    return { error: "Registration is not open for this competition" };
  }

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

  if (teamData.members.length < comp.teamSize) {
    return {
      error: `Team must have at least ${comp.teamSize} members to register`,
    };
  }

  const existingRegistration = await db.query.competitionTeam.findFirst({
    where: and(
      eq(competitionTeam.competitionId, competitionId),
      eq(competitionTeam.teamId, teamId),
    ),
  });

  if (existingRegistration) {
    return { error: "Team is already registered for this competition" };
  }

  await db.insert(competitionTeam).values({
    competitionId,
    teamId,
  });

  revalidatePath(`/competitions/${competitionId}`);
  revalidatePath("/competitions/my");
  revalidatePath(`/admin/competitions/${competitionId}`);
  return { success: true };
}

export async function withdrawTeamFromCompetition(
  competitionId: string,
  teamId: string,
) {
  const currentUser = await getCurrentUser();

  const comp = await db.query.competition.findFirst({
    where: eq(competition.id, competitionId),
  });

  if (!comp) {
    return { error: "Competition not found" };
  }

  if (comp.status !== "registration") {
    return { error: "Can only withdraw during registration phase" };
  }

  const teamData = await db.query.team.findFirst({
    where: eq(team.id, teamId),
  });

  if (!teamData) {
    return { error: "Team not found" };
  }

  if (teamData.captainUserId !== currentUser.id) {
    return { error: "Only the team captain can withdraw the team" };
  }

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

export async function getMyCompetitions() {
  const currentUser = await getCurrentUser();

  const memberships = await db.query.teamMember.findMany({
    where: eq(teamMember.userId, currentUser.id),
  });

  const teamIds = memberships.map((m) => m.teamId);

  if (teamIds.length === 0) {
    return [];
  }

  const registrations = await db.query.competitionTeam.findMany({
    with: {
      competition: true,
      team: true,
    },
  });

  const myRegistrations = registrations.filter((r) =>
    teamIds.includes(r.teamId),
  );

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

export async function getCompetitionStandings(competitionId: string) {
  await getCurrentUser();

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

  if (comp.status === "draft") {
    return null;
  }

  const groupStandings = comp.groups.map((grp) => {
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

export async function getActiveCompetitions() {
  await getCurrentUser();

  const competitions = await db.query.competition.findMany({
    orderBy: desc(competition.createdAt),
    with: {
      competitionTeams: true,
    },
  });

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

export async function getPublicCompetition(competitionId: string) {
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

  if (!comp || comp.status === "draft") {
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

export async function getPublicCompetitionMatches(competitionId: string) {
  const matches = await db.query.match.findMany({
    where: eq(match.competitionId, competitionId),
    with: {
      homeTeam: true,
      awayTeam: true,
      group: true,
      score: true,
    },
    orderBy: [desc(match.round), match.createdAt],
  });

  const upcomingMatches = matches.filter(
    (m) => m.status === "scheduled" || m.status === "in_progress",
  );
  const completedMatches = matches.filter((m) => m.status === "completed");

  return {
    upcoming: upcomingMatches.map((m) => ({
      id: m.id,
      round: m.round,
      isKnockout: m.isKnockout,
      status: m.status,
      scheduledAt: m.scheduledAt,
      homeTeam: {
        id: m.homeTeam.id,
        name: m.homeTeam.name,
      },
      awayTeam: {
        id: m.awayTeam.id,
        name: m.awayTeam.name,
      },
      group: m.group
        ? {
            id: m.group.id,
            name: m.group.name,
          }
        : null,
      score: null,
    })),
    completed: completedMatches.map((m) => ({
      id: m.id,
      round: m.round,
      isKnockout: m.isKnockout,
      status: m.status,
      scheduledAt: m.scheduledAt,
      homeTeam: {
        id: m.homeTeam.id,
        name: m.homeTeam.name,
      },
      awayTeam: {
        id: m.awayTeam.id,
        name: m.awayTeam.name,
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
    })),
  };
}

export async function getPublicCompetitionStandings(competitionId: string) {
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

  if (!comp || comp.status === "draft") {
    return null;
  }

  const groupStandings = comp.groups.map((grp) => {
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

type GroupStanding = {
  competitionTeams: { teamId: string }[];
  matches: {
    homeTeamId: string;
    awayTeamId: string;
    score: { homeScore: number; awayScore: number } | null;
  }[];
};

type TeamStandingResult = {
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

function calculateGroupStandings(grp: GroupStanding): TeamStandingResult[] {
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

  return Array.from(standings.values())
    .map((s) => ({
      teamId: s.teamId,
      teamName: "",
      points: s.points,
      wins: s.wins,
      losses: s.losses,
      draws: s.draws,
      played: s.wins + s.losses + s.draws,
      scored: s.scored,
      conceded: s.conceded,
      difference: s.scored - s.conceded,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.difference !== a.difference) return b.difference - a.difference;
      return b.scored - a.scored;
    });
}
