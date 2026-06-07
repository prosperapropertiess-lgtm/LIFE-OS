import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase.js";
import { classifyIntent } from "../../../lib/intent.js";
import { claudeClassify } from "../../../lib/claude-intent.js";
import { parseFood } from "../../../lib/nutrition.js";
import { addTodoistTask } from "../../../lib/todoist.js";
import { todayYMD, addDays, shortDate } from "../../../lib/time.js";

export const dynamic = "force-dynamic";

function dueLabel(due) {
  if (!due) return null;
  const today = todayYMD();
  if (due === today) return "today";
  if (due === addDays(today, 1)) return "tomorrow";
  return shortDate(due);
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }
  const text = (body.text || "").toString().trim();
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  const sb = getSupabase();
  const today = todayYMD();

  // Try Claude first, fall back to rule-based classifier if key is missing or call fails.
  let intent = await claudeClassify(text);
  if (!intent) {
    intent = classifyIntent(text);
  }
  console.log(`[quick-add] "${text}" → ${JSON.stringify(intent)}`);

  // ── Food ──────────────────────────────────────────────────────────────────
  if (intent.intent === "food") {
    const foodQuery = intent.food || text;
    let macros = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
    let matched = 0;
    let parseError = null;

    try {
      const p = await parseFood(foodQuery);
      macros = { calories: p.calories, protein_g: p.protein_g, carbs_g: p.carbs_g, fat_g: p.fat_g };
      matched = p.matched || 0;
    } catch (e) {
      parseError = e.message || "Could not look up nutrition info.";
      console.error("[quick-add] parseFood error:", e.message);
    }

    return NextResponse.json({
      ok: true,
      intent: "food",
      food: foodQuery,
      matched,
      parse_error: parseError,
      ...macros,
    });
  }

  // ── Training ──────────────────────────────────────────────────────────────
  if (intent.intent === "training") {
    const { data, error } = await sb
      .from("training_log")
      .insert({ date: today, type: intent.type, moves_lifts: intent.notes })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "db" }, { status: 500 });
    return NextResponse.json({
      ok: true, kind: "training", id: data.id, verb: "Logged",
      label: `${intent.type}${intent.notes ? " · " + intent.notes : ""}`,
    });
  }

  // ── Task / Reminder ───────────────────────────────────────────────────────
  const { data, error } = await sb
    .from("tasks")
    .insert({ task: intent.task, type: "Reminder", due: intent.due || null, status: "To Do" })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  await addTodoistTask(intent.task, intent.due);
  return NextResponse.json({
    ok: true, kind: "task", id: data.id, verb: "Added",
    label: `${intent.task}${dueLabel(intent.due) ? " · " + dueLabel(intent.due) : ""}`,
  });
}
