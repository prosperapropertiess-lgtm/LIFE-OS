import { NextResponse } from "next/server";
import { parseFood } from "../../../lib/nutrition.js";

export const dynamic = "force-dynamic";

// Parses a food description into macros WITHOUT saving. Used by the review step.
export async function GET(request) {
  const q = new URL(request.url).searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }
  try {
    const macros = await parseFood(q.trim());
    return NextResponse.json({ ok: true, ...macros });
  } catch (e) {
    return NextResponse.json({ error: "parse_failed" }, { status: 502 });
  }
}
