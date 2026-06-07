import { NextResponse } from "next/server";
import { getSupabase } from "../../../../lib/supabase.js";

export const dynamic = "force-dynamic";

// Saves feedback on the latest plan and re-opens it so the next run incorporates it.
export async function POST(request) {
  let b;
  try { b = await request.json(); } catch (e) { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }
  const feedback = (b.feedback || "").toString().trim();
  if (!feedback) return NextResponse.json({ error: "empty" }, { status: 400 });

  const sb = getSupabase();
  const { data: latest } = await sb
    .from("planner").select("id, feedback").order("created_at", { ascending: false }).limit(1);
  if (!latest || !latest[0]) return NextResponse.json({ error: "none" }, { status: 404 });

  const prior = latest[0].feedback ? latest[0].feedback + "\n" : "";
  const { error } = await sb.from("planner")
    .update({ feedback: prior + feedback, status: "pending", updated_at: new Date().toISOString() })
    .eq("id", latest[0].id);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
