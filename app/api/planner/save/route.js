import { NextResponse } from "next/server";
import { getSupabase } from "../../../../lib/supabase.js";

export const dynamic = "force-dynamic";

function clean(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

// Saves (or updates) the week's schedule + notes for Claude to plan around.
export async function POST(request) {
  let b;
  try { b = await request.json(); } catch (e) { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }

  const shifts = clean(b.shifts);
  const notes = clean(b.notes);
  if (!shifts && !notes) return NextResponse.json({ error: "empty" }, { status: 400 });

  const sb = getSupabase();
  const { data: latest } = await sb
    .from("planner").select("id, status").order("created_at", { ascending: false }).limit(1);

  // Reuse the most recent row if it hasn't been planned yet; otherwise start a fresh one.
  if (latest && latest[0] && latest[0].status === "pending") {
    const { error } = await sb.from("planner")
      .update({ shifts, notes, status: "pending", updated_at: new Date().toISOString() })
      .eq("id", latest[0].id);
    if (error) return NextResponse.json({ error: "db" }, { status: 500 });
    return NextResponse.json({ ok: true, id: latest[0].id });
  }

  const { data, error } = await sb.from("planner")
    .insert({ shifts, notes, status: "pending" }).select("id").single();
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
