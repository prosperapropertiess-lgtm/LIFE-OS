import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase.js";

export const dynamic = "force-dynamic";

const TABLES = {
  food: "food_log",
  training: "training_log",
  task: "tasks",
  sleep: "sleep_log",
  weight: "weight_log",
  focus: "focus_log",
};

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }
  const table = TABLES[body.kind];
  const id = body.id;
  if (!table || !id) return NextResponse.json({ error: "bad_args" }, { status: 400 });

  const sb = getSupabase();
  const { error } = await sb.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
