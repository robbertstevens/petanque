"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { signOut, useSession } from "@/lib/auth-client";

export default function Dashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-zinc-900">
        <h1 className="mb-6 text-center text-2xl font-semibold text-black dark:text-zinc-50">
          Dashboard
        </h1>

        <div className="mb-6 rounded-md bg-zinc-100 p-4 dark:bg-zinc-800">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as
          </p>
          <p className="font-medium text-black dark:text-white">
            {session.user.username ?? session.user.email}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            {session.user.email}
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full rounded-md bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
        >
          Sign Out
        </button>
      </main>
    </div>
  );
}
