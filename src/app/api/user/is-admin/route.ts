import { NextResponse } from "next/server";

import { isCurrentUserAdmin } from "@/lib/actions/competitions-admin";

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin();
    return NextResponse.json({ isAdmin });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
