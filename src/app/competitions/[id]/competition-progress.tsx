type Props = Readonly<{
  status: "draft" | "registration" | "group_stage" | "knockout" | "completed";
}>;

const phases = [
  { key: "registration", label: "Registration" },
  { key: "group_stage", label: "Group Stage" },
  { key: "knockout", label: "Knockout" },
  { key: "completed", label: "Completed" },
] as const;

export function CompetitionProgress({ status }: Props) {
  const currentIndex = phases.findIndex((p) => p.key === status);

  return (
    <div className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
        {phases.map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={phase.key} className="flex items-center">
              <div
                className={`flex items-center gap-2 ${isCurrent ? "text-blue-600 dark:text-blue-400" : isCompleted ? "text-green-600 dark:text-green-400" : "text-zinc-400 dark:text-zinc-500"}`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    isCompleted
                      ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                      : isCurrent
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${isCurrent ? "text-blue-600 dark:text-blue-400" : ""}`}
                >
                  {phase.label}
                </span>
              </div>
              {index < phases.length - 1 && (
                <div
                  className={`hidden h-0.5 w-12 sm:mx-4 sm:block ${
                    isCompleted
                      ? "bg-green-300 dark:bg-green-700"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
