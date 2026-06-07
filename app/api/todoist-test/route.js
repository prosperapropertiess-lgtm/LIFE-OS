import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Diagnostic disabled.
export async function GET() {
  return NextResponse.json({ ok: false }, { status: 404 });
}
