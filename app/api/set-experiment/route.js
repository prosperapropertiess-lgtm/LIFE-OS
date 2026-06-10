import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase.js";
import { weekStart, todayYMD } from "../../../lib/time.js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let b;
  try { b = await request.json(); } catch { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }

  const text = (b.experiment || "").trim();
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  const sb = getSupabase();
  const wkStart = weekStart(todayYMD());

  const { error } = await sb
    .from("weekly_metrics")
    .upsert({ week_start: wkStart, experiment: text }, { onConflict: "week_start" });

  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
