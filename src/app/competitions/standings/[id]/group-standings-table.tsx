import type { GroupStandings } from "@/lib/actions/competitions-user";

type Props = Readonly<{
  group: GroupStandings;
}>;

export function GroupStandingsTable({ group }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
        <h4 className="font-display text-foreground font-medium">
          {group.groupName}
        </h4>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-800/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                Team
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                P
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                W
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                D
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                L
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                PF
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                PA
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                +/-
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                Pts
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
            {group.standings.map((team, index) => (
              <tr
                key={team.teamId}
                className={
                  index < 2 ? "bg-green-50/50 dark:bg-green-900/10" : ""
                }
              >
                <td className="px-4 py-3 text-sm whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                  {index + 1}
                </td>
                <td className="px-4 py-3 text-sm font-medium whitespace-nowrap text-black dark:text-white">
                  {team.teamName}
                </td>
                <td className="px-4 py-3 text-center text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                  {team.played}
                </td>
                <td className="px-4 py-3 text-center text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                  {team.wins}
                </td>
                <td className="px-4 py-3 text-center text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                  {team.draws}
                </td>
                <td className="px-4 py-3 text-center text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                  {team.losses}
                </td>
                <td className="px-4 py-3 text-center text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                  {team.scored}
                </td>
                <td className="px-4 py-3 text-center text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                  {team.conceded}
                </td>
                <td className="px-4 py-3 text-center text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                  <span
                    className={
                      team.difference > 0
                        ? "text-green-600 dark:text-green-400"
                        : team.difference < 0
                          ? "text-red-600 dark:text-red-400"
                          : ""
                    }
                  >
                    {team.difference > 0 ? "+" : ""}
                    {team.difference}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap text-black dark:text-white">
                  {team.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-800/30">
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          P = Played, W = Won, D = Draw, L = Lost, PF = Points For, PA = Points
          Against, +/- = Difference, Pts = Points
        </p>
        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
          Top 2 teams qualify for knockout stage
        </p>
      </div>
    </div>
  );
}
