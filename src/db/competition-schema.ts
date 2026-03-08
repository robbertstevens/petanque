import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth-schema";

// ============================================================================
// User Role (Admin tracking)
// ============================================================================

export const userRole = sqliteTable(
  "user_role",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["admin", "super_admin"] }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index("user_role_userId_idx").on(table.userId)],
);

// ============================================================================
// Team
// ============================================================================

export const team = sqliteTable(
  "team",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    captainUserId: text("captain_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("team_captainUserId_idx").on(table.captainUserId)],
);

// ============================================================================
// Team Member
// ============================================================================

export const teamMember = sqliteTable(
  "team_member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: integer("joined_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    unique("team_member_unique").on(table.teamId, table.userId),
    index("team_member_teamId_idx").on(table.teamId),
    index("team_member_userId_idx").on(table.userId),
  ],
);

// ============================================================================
// Team Invitation
// ============================================================================

export const teamInvitation = sqliteTable(
  "team_invitation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    invitedUserId: text("invited_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    invitedByUserId: text("invited_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "accepted", "declined"] })
      .default("pending")
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    respondedAt: integer("responded_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("team_invitation_teamId_idx").on(table.teamId),
    index("team_invitation_invitedUserId_idx").on(table.invitedUserId),
  ],
);

// ============================================================================
// Competition
// ============================================================================

export const competition = sqliteTable(
  "competition",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    teamSize: integer("team_size").notNull().default(2),
    status: text("status", {
      enum: ["draft", "registration", "group_stage", "knockout", "completed"],
    })
      .default("draft")
      .notNull(),
    startDate: integer("start_date", { mode: "timestamp_ms" }),
    endDate: integer("end_date", { mode: "timestamp_ms" }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("competition_status_idx").on(table.status),
    index("competition_createdByUserId_idx").on(table.createdByUserId),
  ],
);

// ============================================================================
// Group (within a competition)
// ============================================================================

export const group = sqliteTable(
  "group",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    competitionId: text("competition_id")
      .notNull()
      .references(() => competition.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index("group_competitionId_idx").on(table.competitionId)],
);

// ============================================================================
// Competition Team (team registration for a competition)
// ============================================================================

export const competitionTeam = sqliteTable(
  "competition_team",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    competitionId: text("competition_id")
      .notNull()
      .references(() => competition.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    groupId: text("group_id").references(() => group.id, {
      onDelete: "set null",
    }),
    registeredAt: integer("registered_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    unique("competition_team_unique").on(table.competitionId, table.teamId),
    index("competition_team_competitionId_idx").on(table.competitionId),
    index("competition_team_teamId_idx").on(table.teamId),
    index("competition_team_groupId_idx").on(table.groupId),
  ],
);

// ============================================================================
// Match
// ============================================================================

export const match = sqliteTable(
  "match",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    competitionId: text("competition_id")
      .notNull()
      .references(() => competition.id, { onDelete: "cascade" }),
    groupId: text("group_id").references(() => group.id, {
      onDelete: "set null",
    }),
    homeTeamId: text("home_team_id").references(() => team.id, {
      onDelete: "cascade",
    }),
    awayTeamId: text("away_team_id").references(() => team.id, {
      onDelete: "cascade",
    }),
    round: integer("round").notNull().default(1),
    isKnockout: integer("is_knockout", { mode: "boolean" })
      .default(false)
      .notNull(),
    scheduledAt: integer("scheduled_at", { mode: "timestamp_ms" }),
    status: text("status", {
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
    })
      .default("scheduled")
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("match_competitionId_idx").on(table.competitionId),
    index("match_groupId_idx").on(table.groupId),
    index("match_homeTeamId_idx").on(table.homeTeamId),
    index("match_awayTeamId_idx").on(table.awayTeamId),
    index("match_status_idx").on(table.status),
  ],
);

// ============================================================================
// Match Score
// ============================================================================

export const matchScore = sqliteTable(
  "match_score",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    matchId: text("match_id")
      .notNull()
      .unique()
      .references(() => match.id, { onDelete: "cascade" }),
    homeScore: integer("home_score").notNull(),
    awayScore: integer("away_score").notNull(),
    submittedByUserId: text("submitted_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    confirmedByUserId: text("confirmed_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    confirmedAt: integer("confirmed_at", { mode: "timestamp_ms" }),
  },
  (table) => [index("match_score_matchId_idx").on(table.matchId)],
);

// ============================================================================
// Relations
// ============================================================================

export const userRoleRelations = relations(userRole, ({ one }) => ({
  user: one(user, {
    fields: [userRole.userId],
    references: [user.id],
  }),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
  captain: one(user, {
    fields: [team.captainUserId],
    references: [user.id],
  }),
  members: many(teamMember),
  invitations: many(teamInvitation),
  competitionTeams: many(competitionTeam),
  homeMatches: many(match, { relationName: "homeTeam" }),
  awayMatches: many(match, { relationName: "awayTeam" }),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
}));

export const teamInvitationRelations = relations(teamInvitation, ({ one }) => ({
  team: one(team, {
    fields: [teamInvitation.teamId],
    references: [team.id],
  }),
  invitedUser: one(user, {
    fields: [teamInvitation.invitedUserId],
    references: [user.id],
    relationName: "invitedUser",
  }),
  invitedByUser: one(user, {
    fields: [teamInvitation.invitedByUserId],
    references: [user.id],
    relationName: "invitedByUser",
  }),
}));

export const competitionRelations = relations(competition, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [competition.createdByUserId],
    references: [user.id],
  }),
  groups: many(group),
  competitionTeams: many(competitionTeam),
  matches: many(match),
}));

export const groupRelations = relations(group, ({ one, many }) => ({
  competition: one(competition, {
    fields: [group.competitionId],
    references: [competition.id],
  }),
  competitionTeams: many(competitionTeam),
  matches: many(match),
}));

export const competitionTeamRelations = relations(
  competitionTeam,
  ({ one }) => ({
    competition: one(competition, {
      fields: [competitionTeam.competitionId],
      references: [competition.id],
    }),
    team: one(team, {
      fields: [competitionTeam.teamId],
      references: [team.id],
    }),
    group: one(group, {
      fields: [competitionTeam.groupId],
      references: [group.id],
    }),
  }),
);

export const matchRelations = relations(match, ({ one }) => ({
  competition: one(competition, {
    fields: [match.competitionId],
    references: [competition.id],
  }),
  group: one(group, {
    fields: [match.groupId],
    references: [group.id],
  }),
  homeTeam: one(team, {
    fields: [match.homeTeamId],
    references: [team.id],
    relationName: "homeTeam",
  }),
  awayTeam: one(team, {
    fields: [match.awayTeamId],
    references: [team.id],
    relationName: "awayTeam",
  }),
  score: one(matchScore),
}));

export const matchScoreRelations = relations(matchScore, ({ one }) => ({
  match: one(match, {
    fields: [matchScore.matchId],
    references: [match.id],
  }),
  submittedBy: one(user, {
    fields: [matchScore.submittedByUserId],
    references: [user.id],
    relationName: "submittedBy",
  }),
  confirmedBy: one(user, {
    fields: [matchScore.confirmedByUserId],
    references: [user.id],
    relationName: "confirmedBy",
  }),
}));
