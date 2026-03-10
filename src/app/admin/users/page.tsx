import { redirect } from "next/navigation";

import { getAllUsers, isCurrentUserSuperAdmin } from "@/lib/actions/users";

import { UserRow } from "./user-row";

export default async function UsersPage() {
  const isSuperAdmin = await isCurrentUserSuperAdmin();

  if (!isSuperAdmin) {
    redirect("/admin");
  }

  const users = await getAllUsers();

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

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
                User
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Role
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}
