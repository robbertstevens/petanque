/**
 * Seed Script for Petanque Competition Website
 *
 * This script populates the database with test data for local development.
 *
 * Usage:
 * - npm run db:seed
 *
 * Test Accounts (all passwords are "password"):
 * - superadmin: Super admin user (can manage other admins)
 * - admin: Admin user
 * - alice: Captain of "Les Boulistes" and "Solo Warriors"
 * - bob: Captain of "Boule de Feu"
 * - eve: Captain of "Les Cochonnets"
 * - charlie, diana, frank: Team members
 * - grace: Has pending invitation to "Les Boulistes"
 */

import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { bytesToHex } from "@noble/hashes/utils.js";

import * as schema from "../src/db/schema";

// Initialize database
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client, { schema });

// ============================================================================
// Types
// ============================================================================

type User = {
  id: string;
  username: string;
  email: string;
  name: string;
};

type Team = {
  id: string;
  name: string;
  captainUserId: string;
};

type Competition = {
  id: string;
  name: string;
  status: "draft" | "registration" | "group_stage" | "knockout" | "completed";
};

type Group = {
  id: string;
  competitionId: string;
  name: string;
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateUUID(): string {
  return crypto.randomUUID();
}

// Hash password using the same algorithm as better-auth (scrypt)
async function hashPassword(password: string): Promise<string> {
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const key = await scryptAsync(password.normalize("NFKC"), salt, {
    N: 16384,
    r: 16,
    p: 1,
    dkLen: 64,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${bytesToHex(key)}`;
}

// ============================================================================
// Clear Existing Data
// ============================================================================

async function clearDatabase() {
  console.log("Clearing existing data...");

  // Delete in correct order due to foreign key constraints
  // Using sequential awaits to avoid connection limit issues
  await db.delete(schema.matchScore);
  await db.delete(schema.match);
  await db.delete(schema.competitionTeam);
  await db.delete(schema.group);
  await db.delete(schema.competition);
  await db.delete(schema.teamInvitation);
  await db.delete(schema.teamMember);
  await db.delete(schema.team);
  await db.delete(schema.userRole);
  await db.delete(schema.session);
  await db.delete(schema.account);
  await db.delete(schema.verification);
  await db.delete(schema.user);

  console.log("  Database cleared.");
}

// ============================================================================
// Seed Users
// ============================================================================

async function seedUsers(): Promise<Map<string, User>> {
  console.log("\nCreating users...");

  const usersToCreate = [
    {
      username: "superadmin",
      email: "superadmin@example.com",
      name: "Super Admin",
    },
    { username: "admin", email: "admin@example.com", name: "Admin User" },
    { username: "alice", email: "alice@example.com", name: "Alice Johnson" },
    { username: "bob", email: "bob@example.com", name: "Bob Smith" },
    {
      username: "charlie",
      email: "charlie@example.com",
      name: "Charlie Brown",
    },
    { username: "diana", email: "diana@example.com", name: "Diana Prince" },
    { username: "eve", email: "eve@example.com", name: "Eve Wilson" },
    { username: "frank", email: "frank@example.com", name: "Frank Miller" },
    { username: "grace", email: "grace@example.com", name: "Grace Lee" },
  ];

  const users = new Map<string, User>();
  const hashedPassword = await hashPassword("password");

  for (const userData of usersToCreate) {
    const userId = generateUUID();
    const accountId = generateUUID();

    // Create user
    await db.insert(schema.user).values({
      id: userId,
      name: userData.name,
      email: userData.email,
      emailVerified: true,
      username: userData.username,
      displayUsername: userData.username,
    });

    // Create account with password (better-auth stores passwords in account table)
    await db.insert(schema.account).values({
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId: userId,
      password: hashedPassword,
    });

    users.set(userData.username, {
      id: userId,
      username: userData.username,
      email: userData.email,
      name: userData.name,
    });

    console.log(`  Created user: ${userData.username}`);
  }

  return users;
}

// ============================================================================
// Seed Admin Roles
// ============================================================================

async function seedAdminRole(users: Map<string, User>) {
  console.log("\nAssigning admin roles...");

  // Make superadmin a super_admin
  const superAdminUser = users.get("superadmin");
  if (superAdminUser) {
    await db.insert(schema.userRole).values({
      id: generateUUID(),
      userId: superAdminUser.id,
      role: "super_admin",
    });
    console.log(`  Made ${superAdminUser.username} a super admin.`);
  }

  // Make admin an admin
  const adminUser = users.get("admin");
  if (adminUser) {
    await db.insert(schema.userRole).values({
      id: generateUUID(),
      userId: adminUser.id,
      role: "admin",
    });
    console.log(`  Made ${adminUser.username} an admin.`);
  }
}

// ============================================================================
// Seed Teams
// ============================================================================

async function seedTeams(users: Map<string, User>): Promise<Map<string, Team>> {
  console.log("\nCreating teams...");

  const teams = new Map<string, Team>();

  const teamsToCreate = [
    {
      name: "Les Boulistes",
      captainUsername: "alice",
      members: ["alice", "charlie"],
    },
    {
      name: "Boule de Feu",
      captainUsername: "bob",
      members: ["bob", "diana"],
    },
    {
      name: "Les Cochonnets",
      captainUsername: "eve",
      members: ["eve", "frank"],
    },
    {
      name: "Solo Warriors",
      captainUsername: "alice",
      members: ["alice"], // Only 1 member - can't register for 2-player comps
    },
  ];

  for (const teamData of teamsToCreate) {
    const captain = users.get(teamData.captainUsername);
    if (!captain) {
      console.error(`  Captain ${teamData.captainUsername} not found!`);
      continue;
    }

    const teamId = generateUUID();

    // Create team
    await db.insert(schema.team).values({
      id: teamId,
      name: teamData.name,
      captainUserId: captain.id,
    });

    teams.set(teamData.name, {
      id: teamId,
      name: teamData.name,
      captainUserId: captain.id,
    });

    // Add members
    for (const memberUsername of teamData.members) {
      const member = users.get(memberUsername);
      if (member) {
        await db.insert(schema.teamMember).values({
          id: generateUUID(),
          teamId,
          userId: member.id,
        });
      }
    }

    console.log(
      `  Created team: ${teamData.name} (captain: ${teamData.captainUsername}, members: ${teamData.members.join(", ")})`,
    );
  }

  return teams;
}

// ============================================================================
// Seed Team Invitation
// ============================================================================

async function seedInvitations(
  users: Map<string, User>,
  teams: Map<string, Team>,
) {
  console.log("\nCreating pending invitations...");

  const grace = users.get("grace");
  const alice = users.get("alice");
  const lesBoulistes = teams.get("Les Boulistes");

  if (grace && alice && lesBoulistes) {
    await db.insert(schema.teamInvitation).values({
      id: generateUUID(),
      teamId: lesBoulistes.id,
      invitedUserId: grace.id,
      invitedByUserId: alice.id,
      status: "pending",
    });

    console.log(`  Grace has a pending invitation to join Les Boulistes.`);
  }
}

// ============================================================================
// Seed Competitions
// ============================================================================

async function seedCompetitions(
  users: Map<string, User>,
): Promise<Map<string, Competition>> {
  console.log("\nCreating competitions...");

  const competitions = new Map<string, Competition>();
  const admin = users.get("admin");

  if (!admin) {
    console.error("  Admin user not found!");
    return competitions;
  }

  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const competitionsToCreate = [
    {
      name: "Summer Championship 2025",
      description:
        "The premier petanque competition of the summer season. Open to all skill levels!",
      status: "registration" as const,
      teamSize: 2,
      startDate: oneWeekFromNow,
      endDate: twoWeeksFromNow,
    },
    {
      name: "Spring Cup 2025",
      description:
        "Competitive tournament with group stage matches in progress.",
      status: "group_stage" as const,
      teamSize: 2,
      startDate: twoWeeksAgo,
      endDate: oneWeekFromNow,
    },
    {
      name: "Winter Tournament 2024",
      description: "The completed winter tournament with final standings.",
      status: "completed" as const,
      teamSize: 2,
      startDate: oneMonthAgo,
      endDate: twoWeeksAgo,
    },
    {
      name: "Autumn Classic 2025",
      description: "Upcoming tournament still in planning phase.",
      status: "draft" as const,
      teamSize: 3,
      startDate: null,
      endDate: null,
    },
  ];

  for (const compData of competitionsToCreate) {
    const compId = generateUUID();

    await db.insert(schema.competition).values({
      id: compId,
      name: compData.name,
      description: compData.description,
      status: compData.status,
      teamSize: compData.teamSize,
      startDate: compData.startDate,
      endDate: compData.endDate,
      createdByUserId: admin.id,
    });

    competitions.set(compData.name, {
      id: compId,
      name: compData.name,
      status: compData.status,
    });

    console.log(`  Created competition: ${compData.name} (${compData.status})`);
  }

  return competitions;
}

// ============================================================================
// Seed Groups
// ============================================================================

async function seedGroups(
  competitions: Map<string, Competition>,
): Promise<Map<string, Group>> {
  console.log("\nCreating groups...");

  const groups = new Map<string, Group>();

  // Spring Cup 2025 - group_stage - has 2 groups
  const springCup = competitions.get("Spring Cup 2025");
  if (springCup) {
    const groupA = generateUUID();
    const groupB = generateUUID();

    await db.insert(schema.group).values([
      { id: groupA, competitionId: springCup.id, name: "Group A" },
      { id: groupB, competitionId: springCup.id, name: "Group B" },
    ]);

    groups.set("Spring Cup 2025 - Group A", {
      id: groupA,
      competitionId: springCup.id,
      name: "Group A",
    });
    groups.set("Spring Cup 2025 - Group B", {
      id: groupB,
      competitionId: springCup.id,
      name: "Group B",
    });

    console.log(`  Created groups for Spring Cup 2025: Group A, Group B`);
  }

  // Winter Tournament 2024 - completed - has 1 group
  const winterTournament = competitions.get("Winter Tournament 2024");
  if (winterTournament) {
    const groupA = generateUUID();

    await db.insert(schema.group).values({
      id: groupA,
      competitionId: winterTournament.id,
      name: "Group A",
    });

    groups.set("Winter Tournament 2024 - Group A", {
      id: groupA,
      competitionId: winterTournament.id,
      name: "Group A",
    });

    console.log(`  Created groups for Winter Tournament 2024: Group A`);
  }

  return groups;
}

// ============================================================================
// Seed Competition Registrations
// ============================================================================

async function seedCompetitionTeams(
  teams: Map<string, Team>,
  competitions: Map<string, Competition>,
  groups: Map<string, Group>,
): Promise<Map<string, string>> {
  console.log("\nRegistering teams for competitions...");

  const competitionTeamIds = new Map<string, string>();

  // Summer Championship 2025 (registration) - 2 teams registered
  const summerChamp = competitions.get("Summer Championship 2025");
  if (summerChamp) {
    const lesBoulistes = teams.get("Les Boulistes");
    const bouleDeFeu = teams.get("Boule de Feu");

    if (lesBoulistes) {
      const ctId = generateUUID();
      await db.insert(schema.competitionTeam).values({
        id: ctId,
        competitionId: summerChamp.id,
        teamId: lesBoulistes.id,
        groupId: null,
      });
      competitionTeamIds.set(`${summerChamp.name}-${lesBoulistes.name}`, ctId);
    }

    if (bouleDeFeu) {
      const ctId = generateUUID();
      await db.insert(schema.competitionTeam).values({
        id: ctId,
        competitionId: summerChamp.id,
        teamId: bouleDeFeu.id,
        groupId: null,
      });
      competitionTeamIds.set(`${summerChamp.name}-${bouleDeFeu.name}`, ctId);
    }

    console.log(
      `  Registered for Summer Championship 2025: Les Boulistes, Boule de Feu`,
    );
  }

  // Spring Cup 2025 (group_stage) - 3 teams in groups
  const springCup = competitions.get("Spring Cup 2025");
  const groupA = groups.get("Spring Cup 2025 - Group A");
  const groupB = groups.get("Spring Cup 2025 - Group B");

  if (springCup && groupA && groupB) {
    const lesBoulistes = teams.get("Les Boulistes");
    const bouleDeFeu = teams.get("Boule de Feu");
    const lesCochonnets = teams.get("Les Cochonnets");

    // Les Boulistes and Boule de Feu in Group A
    if (lesBoulistes) {
      const ctId = generateUUID();
      await db.insert(schema.competitionTeam).values({
        id: ctId,
        competitionId: springCup.id,
        teamId: lesBoulistes.id,
        groupId: groupA.id,
      });
      competitionTeamIds.set(`${springCup.name}-${lesBoulistes.name}`, ctId);
    }

    if (bouleDeFeu) {
      const ctId = generateUUID();
      await db.insert(schema.competitionTeam).values({
        id: ctId,
        competitionId: springCup.id,
        teamId: bouleDeFeu.id,
        groupId: groupA.id,
      });
      competitionTeamIds.set(`${springCup.name}-${bouleDeFeu.name}`, ctId);
    }

    // Les Cochonnets in Group B (alone for now)
    if (lesCochonnets) {
      const ctId = generateUUID();
      await db.insert(schema.competitionTeam).values({
        id: ctId,
        competitionId: springCup.id,
        teamId: lesCochonnets.id,
        groupId: groupB.id,
      });
      competitionTeamIds.set(`${springCup.name}-${lesCochonnets.name}`, ctId);
    }

    console.log(
      `  Registered for Spring Cup 2025: Les Boulistes (A), Boule de Feu (A), Les Cochonnets (B)`,
    );
  }

  // Winter Tournament 2024 (completed) - 3 teams all in Group A
  const winterTournament = competitions.get("Winter Tournament 2024");
  const winterGroupA = groups.get("Winter Tournament 2024 - Group A");

  if (winterTournament && winterGroupA) {
    const teamsList = ["Les Boulistes", "Boule de Feu", "Les Cochonnets"];

    for (const teamName of teamsList) {
      const team = teams.get(teamName);
      if (team) {
        const ctId = generateUUID();
        await db.insert(schema.competitionTeam).values({
          id: ctId,
          competitionId: winterTournament.id,
          teamId: team.id,
          groupId: winterGroupA.id,
        });
        competitionTeamIds.set(`${winterTournament.name}-${team.name}`, ctId);
      }
    }

    console.log(
      `  Registered for Winter Tournament 2024: Les Boulistes, Boule de Feu, Les Cochonnets (all Group A)`,
    );
  }

  return competitionTeamIds;
}

// ============================================================================
// Seed Matches
// ============================================================================

async function seedMatches(
  teams: Map<string, Team>,
  competitions: Map<string, Competition>,
  groups: Map<string, Group>,
  users: Map<string, User>,
) {
  console.log("\nCreating matches...");

  const admin = users.get("admin");
  if (!admin) return;

  // Spring Cup 2025 - Group A matches (in progress - mixed statuses for testing)
  const springCup = competitions.get("Spring Cup 2025");
  const springGroupA = groups.get("Spring Cup 2025 - Group A");

  if (springCup && springGroupA) {
    const lesBoulistes = teams.get("Les Boulistes");
    const bouleDeFeu = teams.get("Boule de Feu");
    const lesCochonnets = teams.get("Les Cochonnets");

    if (lesBoulistes && bouleDeFeu) {
      // Match 1: Les Boulistes vs Boule de Feu (completed with score)
      const match1Id = generateUUID();
      await db.insert(schema.match).values({
        id: match1Id,
        competitionId: springCup.id,
        groupId: springGroupA.id,
        homeTeamId: lesBoulistes.id,
        awayTeamId: bouleDeFeu.id,
        round: 1,
        isKnockout: false,
        status: "completed",
      });

      await db.insert(schema.matchScore).values({
        id: generateUUID(),
        matchId: match1Id,
        homeScore: 13,
        awayScore: 8,
        submittedByUserId: admin.id,
        confirmedByUserId: admin.id,
        confirmedAt: new Date(),
      });

      console.log(
        `  Spring Cup - Group A: Les Boulistes 13 - 8 Boule de Feu (completed)`,
      );

      // Match 2: Boule de Feu vs Les Boulistes (reverse fixture - IN PROGRESS)
      const match2Id = generateUUID();
      await db.insert(schema.match).values({
        id: match2Id,
        competitionId: springCup.id,
        groupId: springGroupA.id,
        homeTeamId: bouleDeFeu.id,
        awayTeamId: lesBoulistes.id,
        round: 2,
        isKnockout: false,
        status: "in_progress",
      });

      // Partial score for in-progress match
      await db.insert(schema.matchScore).values({
        id: generateUUID(),
        matchId: match2Id,
        homeScore: 7,
        awayScore: 5,
        submittedByUserId: admin.id,
      });

      console.log(
        `  Spring Cup - Group A: Boule de Feu 7 - 5 Les Boulistes (in progress)`,
      );
    }

    // Add Les Cochonnets to Group A for more matches
    if (lesCochonnets && lesBoulistes && bouleDeFeu) {
      // Update Les Cochonnets to Group A (they were in Group B)
      // Match 3: Les Cochonnets vs Les Boulistes (scheduled - ready to play)
      const match3Id = generateUUID();
      await db.insert(schema.match).values({
        id: match3Id,
        competitionId: springCup.id,
        groupId: springGroupA.id,
        homeTeamId: lesCochonnets.id,
        awayTeamId: lesBoulistes.id,
        round: 2,
        isKnockout: false,
        status: "scheduled",
      });

      console.log(
        `  Spring Cup - Group A: Les Cochonnets vs Les Boulistes (scheduled)`,
      );

      // Match 4: Les Cochonnets vs Boule de Feu (scheduled)
      const match4Id = generateUUID();
      await db.insert(schema.match).values({
        id: match4Id,
        competitionId: springCup.id,
        groupId: springGroupA.id,
        homeTeamId: lesCochonnets.id,
        awayTeamId: bouleDeFeu.id,
        round: 3,
        isKnockout: false,
        status: "scheduled",
      });

      console.log(
        `  Spring Cup - Group A: Les Cochonnets vs Boule de Feu (scheduled)`,
      );
    }
  }

  // Winter Tournament 2024 - All matches completed
  const winterTournament = competitions.get("Winter Tournament 2024");
  const winterGroupA = groups.get("Winter Tournament 2024 - Group A");

  if (winterTournament && winterGroupA) {
    const lesBoulistes = teams.get("Les Boulistes");
    const bouleDeFeu = teams.get("Boule de Feu");
    const lesCochonnets = teams.get("Les Cochonnets");

    if (lesBoulistes && bouleDeFeu && lesCochonnets) {
      // Match 1: Les Boulistes vs Boule de Feu
      const match1Id = generateUUID();
      await db.insert(schema.match).values({
        id: match1Id,
        competitionId: winterTournament.id,
        groupId: winterGroupA.id,
        homeTeamId: lesBoulistes.id,
        awayTeamId: bouleDeFeu.id,
        round: 1,
        isKnockout: false,
        status: "completed",
      });
      await db.insert(schema.matchScore).values({
        id: generateUUID(),
        matchId: match1Id,
        homeScore: 13,
        awayScore: 11,
        submittedByUserId: admin.id,
        confirmedByUserId: admin.id,
        confirmedAt: new Date(),
      });

      // Match 2: Les Boulistes vs Les Cochonnets
      const match2Id = generateUUID();
      await db.insert(schema.match).values({
        id: match2Id,
        competitionId: winterTournament.id,
        groupId: winterGroupA.id,
        homeTeamId: lesBoulistes.id,
        awayTeamId: lesCochonnets.id,
        round: 1,
        isKnockout: false,
        status: "completed",
      });
      await db.insert(schema.matchScore).values({
        id: generateUUID(),
        matchId: match2Id,
        homeScore: 13,
        awayScore: 7,
        submittedByUserId: admin.id,
        confirmedByUserId: admin.id,
        confirmedAt: new Date(),
      });

      // Match 3: Boule de Feu vs Les Cochonnets
      const match3Id = generateUUID();
      await db.insert(schema.match).values({
        id: match3Id,
        competitionId: winterTournament.id,
        groupId: winterGroupA.id,
        homeTeamId: bouleDeFeu.id,
        awayTeamId: lesCochonnets.id,
        round: 2,
        isKnockout: false,
        status: "completed",
      });
      await db.insert(schema.matchScore).values({
        id: generateUUID(),
        matchId: match3Id,
        homeScore: 13,
        awayScore: 9,
        submittedByUserId: admin.id,
        confirmedByUserId: admin.id,
        confirmedAt: new Date(),
      });

      console.log(
        `  Winter Tournament 2024 - Group A: 3 matches (all completed)`,
      );
      console.log(`    Les Boulistes 13 - 11 Boule de Feu`);
      console.log(`    Les Boulistes 13 - 7 Les Cochonnets`);
      console.log(`    Boule de Feu 13 - 9 Les Cochonnets`);
    }
  }
}

// ============================================================================
// Print Summary
// ============================================================================

function printSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("SEED COMPLETED SUCCESSFULLY");
  console.log("=".repeat(60));
  console.log("\nTest Accounts (all passwords are 'password'):");
  console.log("  admin    - Admin user with full access");
  console.log("  alice    - Captain of 'Les Boulistes' and 'Solo Warriors'");
  console.log("  bob      - Captain of 'Boule de Feu'");
  console.log("  eve      - Captain of 'Les Cochonnets'");
  console.log("  charlie  - Member of 'Les Boulistes'");
  console.log("  diana    - Member of 'Boule de Feu'");
  console.log("  frank    - Member of 'Les Cochonnets'");
  console.log("  grace    - Has pending invitation to 'Les Boulistes'");
  console.log("\nCompetitions:");
  console.log("  Summer Championship 2025 - Open for registration");
  console.log("  Spring Cup 2025          - Group stage in progress");
  console.log("  Winter Tournament 2024   - Completed");
  console.log("  Autumn Classic 2025      - Draft (not visible to users)");
  console.log("\n" + "=".repeat(60));
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("Petanque Seed Script");
  console.log("=".repeat(60));

  try {
    // Clear existing data
    await clearDatabase();

    // Seed data
    const users = await seedUsers();

    if (users.size === 0) {
      console.error("\nERROR: Failed to create users!");
      process.exit(1);
    }

    await seedAdminRole(users);
    const teams = await seedTeams(users);
    await seedInvitations(users, teams);
    const competitions = await seedCompetitions(users);
    const groups = await seedGroups(competitions);
    await seedCompetitionTeams(teams, competitions, groups);
    await seedMatches(teams, competitions, groups, users);

    printSummary();
  } catch (error) {
    console.error("\nERROR during seeding:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
