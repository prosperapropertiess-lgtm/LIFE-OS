import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase.js";
import { addTodoistTask } from "../../../lib/todoist.js";
import { todayYMD } from "../../../lib/time.js";

export const dynamic = "force-dynamic";

function clean(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}
function numf(v) {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/,/g, ".").trim());
  return Number.isFinite(n) ? n : null;
}

export async function POST(request) {
  let b;
  try { b = await request.json(); } catch (e) { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }
  const sb = getSupabase();
  const kind = b.kind;
  const date = clean(b.date) ? String(b.date).slice(0, 10) : todayYMD();

  async function existsForDate(table) {
    const { data } = await sb.from(table).select("id").eq("date", date).limit(1);
    return data && data.length ? data[0].id : null;
  }

  try {
    if (kind === "training") {
      const { data, error } = await sb.from("training_log").insert({
        date, type: clean(b.type) || "Jiu Jitsu",
        duration_min: numf(b.duration_min),
        moves_lifts: clean(b.moves_lifts),
        notes: clean(b.notes),
        energy: clean(b.energy),
      }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ ok: true, kind: "training", id: data.id, label: `${clean(b.type) || "Jiu Jitsu"} session saved` });
    }

    if (kind === "sleep") {
      const dup = await existsForDate("sleep_log");
      if (dup) return NextResponse.json({ error: "dup", message: `Sleep is already logged for ${date}.` }, { status: 409 });
      const { data, error } = await sb.from("sleep_log").insert({
        date, hours: numf(b.hours), quality: clean(b.quality), notes: clean(b.notes),
      }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ ok: true, kind: "sleep", id: data.id, label: "Sleep saved" });
    }

    if (kind === "weight") {
      const w = numf(b.weight_kg);
      if (w == null) return NextResponse.json({ error: "empty", message: "Enter a weight." }, { status: 400 });
      const dup = await existsForDate("weight_log");
      if (dup) return NextResponse.json({ error: "dup", message: `Weight is already logged for ${date}.` }, { status: 409 });
      const { data, error } = await sb.from("weight_log").insert({ date, weight_kg: w, notes: clean(b.notes) }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ ok: true, kind: "weight", id: data.id, label: `Weight saved · ${w} kg` });
    }

    if (kind === "focus") {
      const { data, error } = await sb.from("focus_log").insert({
        date, hours: numf(b.hours) ?? 0, notes: clean(b.notes),
      }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ ok: true, kind: "focus", id: data.id, label: `${numf(b.hours) ?? 0} hrs of focus saved` });
    }

    if (kind === "task") {
      const { data, error } = await sb.from("tasks").insert({
        task: clean(b.task) || "Untitled", type: clean(b.type) || "To-do",
        due: clean(b.due), status: "To Do", notes: clean(b.notes),
      }).select("id").single();
      if (error) throw error;
      await addTodoistTask(clean(b.task) || "Task", clean(b.due));
      return NextResponse.json({ ok: true, kind: "task", id: data.id, label: `${clean(b.task) || "Task"} added` });
    }

    return NextResponse.json({ error: "bad_kind" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "db" }, { status: 500 });
  }
}
