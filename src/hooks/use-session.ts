"use client";

import { authClient } from "@/lib/auth-client";

export function useSession() {
  const { data: session, isPending } = authClient.useSession();
  return { session, isLoading: isPending };
}
