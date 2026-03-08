import Link from "next/link";

export default function CompetitionNotFound() {
  return (
    <div className="py-12 text-center">
      <h2 className="text-xl font-semibold text-black dark:text-white">
        Competition Not Found
      </h2>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        This competition may not exist or is not yet published.
      </p>
      <Link
        href="/competitions"
        className="mt-4 inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        Browse Active Competitions →
      </Link>
    </div>
  );
}
