type StatusBadgeProps = {
  status: "draft" | "registration" | "group_stage" | "knockout" | "completed";
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyle = () => {
    switch (status) {
      case "draft":
        return {
          backgroundColor: "var(--badge-draft-bg)",
          color: "var(--badge-draft-text)",
        };
      case "registration":
        return {
          backgroundColor: "var(--badge-registration-bg)",
          color: "var(--badge-registration-text)",
        };
      case "group_stage":
        return {
          backgroundColor: "var(--badge-group-bg)",
          color: "var(--badge-group-text)",
        };
      case "knockout":
        return {
          backgroundColor: "var(--badge-knockout-bg)",
          color: "var(--badge-knockout-text)",
        };
      case "completed":
        return {
          backgroundColor: "var(--badge-completed-bg)",
          color: "var(--badge-completed-text)",
        };
      default:
        return {
          backgroundColor: "var(--badge-draft-bg)",
          color: "var(--badge-draft-text)",
        };
    }
  };

  const labels = {
    draft: "Draft",
    registration: "Registration",
    group_stage: "Group Stage",
    knockout: "Knockout",
    completed: "Completed",
  };

  return (
    <span
      className="inline-block rounded-full px-2 py-1 text-xs font-medium"
      style={getStatusStyle()}
    >
      {labels[status]}
    </span>
  );
}
