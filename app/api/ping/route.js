import { NextResponse } from "next/server";
import { ping } from "../../../lib/data.js";

// Hit daily by Vercel Cron so the Supabase project never pauses.
export const dynamic = "force-dynamic";

export async function GET() {
  const ok = await ping();
  return NextResponse.json({ ok, at: new Date().toISOString() });
}
