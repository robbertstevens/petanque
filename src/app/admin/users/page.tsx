import { redirect } from "next/navigation";

import { getAllUsers, isCurrentUserSuperAdmin } from "@/lib/actions/users";
import { Table } from "@/components/table";

import { UserActions, formatUserDate } from "./user-actions";
import { RoleBadge } from "./role-badge";

type User = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  createdAt: Date;
  role: "admin" | "super_admin" | null;
};

export default async function UsersPage() {
  const isSuperAdmin = await isCurrentUserSuperAdmin();

  if (!isSuperAdmin) {
    redirect("/admin");
  }

  const users = await getAllUsers();

  const columns = [
    {
      key: "user",
      header: "User",
      cell: (user: User) => (
        <div>
          <p className="font-medium text-black dark:text-white">
            {user.name ?? user.username ?? "Unnamed"}
          </p>
          {user.username && user.name && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              @{user.username}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (user: User) => (
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {user.email}
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (user: User) => <RoleBadge role={user.role} />,
    },
    {
      key: "joined",
      header: "Joined",
      cell: (user: User) => (
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatUserDate(user.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      cell: (user: User) => <UserActions user={user} />,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h2 className="font-display text-foreground text-xl font-semibold">
          User Management
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          View all users and manage admin roles
        </p>
      </div>

      <Table
        data={users}
        columns={columns}
        keyExtractor={(user) => user.id}
        emptyState={
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-500 dark:text-zinc-400">No users found</p>
          </div>
        }
      />
    </div>
  );
}
