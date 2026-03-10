type RoleBadgeProps = {
  role: "admin" | "super_admin" | null;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const getRoleStyle = (r: string) => {
    switch (r) {
      case "admin":
        return {
          backgroundColor: "var(--badge-group-bg)",
          color: "var(--badge-group-text)",
        };
      case "super_admin":
        return {
          backgroundColor: "var(--badge-knockout-bg)",
          color: "var(--badge-knockout-text)",
        };
      default:
        return {
          backgroundColor: "var(--badge-draft-bg)",
          color: "var(--badge-draft-text)",
        };
    }
  };

  if (role) {
    return (
      <span
        className="rounded-full px-2 py-1 text-xs font-medium"
        style={getRoleStyle(role)}
      >
        {role.replace("_", " ")}
      </span>
    );
  }

  return <span className="text-sm text-zinc-400 dark:text-zinc-500">User</span>;
}
