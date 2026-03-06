import { relations } from "drizzle-orm";

import { account, session, user } from "./auth-schema";
import {
  competition,
  matchScore,
  team,
  teamInvitation,
  teamMember,
  userRole,
} from "./competition-schema";

// ============================================================================
// Extended User Relations (combines auth + competition relations)
// ============================================================================

export const extendedUserRelations = relations(user, ({ many, one }) => ({
  // Auth relations
  sessions: many(session),
  accounts: many(account),
  // Competition relations
  role: one(userRole),
  captainedTeams: many(team),
  teamMemberships: many(teamMember),
  receivedInvitations: many(teamInvitation, { relationName: "invitedUser" }),
  sentInvitations: many(teamInvitation, { relationName: "invitedByUser" }),
  createdCompetitions: many(competition),
  submittedScores: many(matchScore, { relationName: "submittedBy" }),
  confirmedScores: many(matchScore, { relationName: "confirmedBy" }),
}));
