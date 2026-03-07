"use server";

import { eq, and, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { userRole } from "@/db/competition-schema";
import { user } from "@/db/auth-schema";
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
// Helper: Check if user is super-admin
// ============================================================================

export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  const currentUser = await getCurrentUser();

  const role = await db.query.userRole.findFirst({
    where: and(
      eq(userRole.userId, currentUser.id),
      eq(userRole.role, "super_admin"),
    ),
  });

  return !!role;
}

// ============================================================================
// Helper: Check if user is admin or super-admin
// ============================================================================

export async function isCurrentUserAdminOrSuperAdmin(): Promise<boolean> {
  const currentUser = await getCurrentUser();

  const role = await db.query.userRole.findFirst({
    where: and(
      eq(userRole.userId, currentUser.id),
      or(eq(userRole.role, "admin"), eq(userRole.role, "super_admin")),
    ),
  });

  return !!role;
}

async function requireSuperAdmin() {
  const isSuperAdmin = await isCurrentUserSuperAdmin();
  if (!isSuperAdmin) {
    throw new Error("Super admin access required");
  }
  return getCurrentUser();
}

// ============================================================================
// Get All Users (Super-Admin Only)
// ============================================================================

export async function getAllUsers() {
  await requireSuperAdmin();

  const users = await db.query.user.findMany({
    with: {
      role: true,
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    createdAt: u.createdAt,
    role: u.role?.role ?? null,
  }));
}

// ============================================================================
// Promote User to Admin (Super-Admin Only)
// ============================================================================

export async function promoteUserToAdmin(userId: string) {
  await requireSuperAdmin();

  // Check if user exists
  const targetUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!targetUser) {
    return { error: "User not found" };
  }

  // Check if user already has a role
  const existingRole = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  });

  if (existingRole) {
    if (existingRole.role === "admin") {
      return { error: "User is already an admin" };
    }
    if (existingRole.role === "super_admin") {
      return { error: "Cannot modify a super admin" };
    }
  }

  // Add admin role
  await db.insert(userRole).values({
    userId,
    role: "admin",
  });

  revalidatePath("/admin/users");
  return { success: true };
}

// ============================================================================
// Demote Admin to Regular User (Super-Admin Only)
// ============================================================================

export async function demoteAdmin(userId: string) {
  await requireSuperAdmin();

  // Check if user has a role
  const existingRole = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  });

  if (!existingRole) {
    return { error: "User is not an admin" };
  }

  if (existingRole.role === "super_admin") {
    return { error: "Cannot demote a super admin" };
  }

  // Remove admin role
  await db.delete(userRole).where(eq(userRole.userId, userId));

  revalidatePath("/admin/users");
  return { success: true };
}

// ============================================================================
// Get Current User Role
// ============================================================================

export async function getCurrentUserRole(): Promise<
  "admin" | "super_admin" | null
> {
  const currentUser = await getCurrentUser();

  const role = await db.query.userRole.findFirst({
    where: eq(userRole.userId, currentUser.id),
  });

  return role?.role ?? null;
}
