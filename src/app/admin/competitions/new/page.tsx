"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

import { createCompetition } from "@/lib/actions/competitions-admin";

type State = {
  error?: string;
  success?: boolean;
  competitionId?: string;
} | null;

export default function NewCompetitionPage() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prevState, formData) => {
      const result = await createCompetition(formData);
      return result;
    },
    null,
  );

  useEffect(() => {
    if (state?.success && state.competitionId) {
      router.push(`/admin/competitions/${state.competitionId}`);
    }
  }, [state, router]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/admin/competitions"
          className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
        >
          &larr; Back to Competitions
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-black dark:text-white">
          Create Competition
        </h2>
      </div>

      <form
        action={formAction}
        className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Competition Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={3}
            maxLength={100}
            placeholder="Summer Tournament 2024"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Optional description of the competition..."
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="teamSize"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Team Size *
          </label>
          <select
            id="teamSize"
            name="teamSize"
            required
            defaultValue="2"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          >
            <option value="2">Doublette (2 players)</option>
            <option value="3">Triplette (3 players)</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="startDate"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Start Date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              End Date
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isPending ? "Creating..." : "Create Competition"}
          </button>
          <Link
            href="/admin/competitions"
            className="rounded-md border border-zinc-300 px-4 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
