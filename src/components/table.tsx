import { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (item: T) => ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyState?: ReactNode;
  wrapperClassName?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
};

export function Table<T>({
  data,
  columns,
  keyExtractor,
  emptyState,
  wrapperClassName = "",
  tableClassName = "",
  headerClassName = "",
  bodyClassName = "",
}: TableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={`overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 ${wrapperClassName}`}
    >
      <table className={`min-w-full ${tableClassName}`}>
        <thead className={`bg-zinc-50 dark:bg-zinc-800/50 ${headerClassName}`}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap text-zinc-700 dark:text-zinc-300 ${
                  column.align === "center"
                    ? "text-center"
                    : column.align === "right"
                      ? "text-right"
                      : "text-left"
                } ${column.className || ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          className={`divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900 ${bodyClassName}`}
        >
          {data.map((item) => (
            <tr key={keyExtractor(item)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 whitespace-nowrap ${
                    column.align === "center"
                      ? "text-center"
                      : column.align === "right"
                        ? "text-right"
                        : "text-left"
                  } ${column.className || ""}`}
                >
                  {column.cell(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
