import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase.js";

export const dynamic = "force-dynamic";

// Apple Health workout activity names → our training types
// Add more here if you log other workouts on Watch
const WORKOUT_MAP = {
  "Martial Arts":                "Jiu Jitsu",
  "Mixed Martial Arts":          "Jiu Jitsu",
  "Kickboxing":                  "Jiu Jitsu",
  "Wrestling":                   "Jiu Jitsu",
  "Judo":                        "Jiu Jitsu",
  "Barre":                       "Jiu Jitsu",   // sometimes used
  "Traditional Strength Training": "Gym",
  "Functional Strength Training":  "Gym",
  "High Intensity Interval Training": "Gym",
  "Cross Training":              "Gym",
  "Core Training":               "Gym",
  "Mixed Cardio":                "Gym",
  "Fitness Gaming":              "Gym",
  "Other":                       "Gym",
};

function authorized(request) {
  const secret = process.env.HEALTH_SYNC_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === "Bearer " + secret;
}

function numf(v) {
  if (v == null) return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

export async function POST(request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let b;
  try { b = await request.json(); } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const sb = getSupabase();
  const date = b.date ? String(b.date).slice(0, 10) : null;
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  // ── Sleep ────────────────────────────────────────────────────
  if (b.type === "sleep") {
    const hours = numf(b.hours);
    if (!hours || hours < 1 || hours > 24) {
      return NextResponse.json({ error: "invalid hours" }, { status: 400 });
    }

    // Skip if already logged manually for this date
    const { data: existing } = await sb.from("sleep_log").select("id").eq("date", date).limit(1);
    if (existing?.length) {
      return NextResponse.json({ ok: true, skipped: true, reason: "already logged for " + date });
    }

    const { error } = await sb.from("sleep_log").insert({
      date, hours, quality: "Good", notes: "Apple Health",
    });
    if (error) return NextResponse.json({ error: "db", detail: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, synced: "sleep", hours, date });
  }

  // ── Weight ───────────────────────────────────────────────────
  if (b.type === "weight") {
    const weight_kg = numf(b.weight_kg);
    if (!weight_kg || weight_kg < 20 || weight_kg > 300) {
      return NextResponse.json({ error: "invalid weight" }, { status: 400 });
    }

    const { data: existing } = await sb.from("weight_log").select("id").eq("date", date).limit(1);
    if (existing?.length) {
      return NextResponse.json({ ok: true, skipped: true, reason: "already logged for " + date });
    }

    const { error } = await sb.from("weight_log").insert({
      date, weight_kg, notes: "Apple Health",
    });
    if (error) return NextResponse.json({ error: "db", detail: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, synced: "weight", weight_kg, date });
  }

  // ── Workout ──────────────────────────────────────────────────
  if (b.type === "workout") {
    const activity = String(b.activity || "").trim();
    const trainingType = WORKOUT_MAP[activity];

    if (!trainingType) {
      return NextResponse.json({ ok: true, skipped: true, reason: "unmapped activity: " + activity });
    }

    const duration_min = numf(b.duration_min);

    // Skip if same type already logged for this date
    const { data: existing } = await sb.from("training_log").select("id")
      .eq("date", date).eq("type", trainingType).limit(1);
    if (existing?.length) {
      return NextResponse.json({ ok: true, skipped: true, reason: trainingType + " already logged for " + date });
    }

    const { error } = await sb.from("training_log").insert({
      date,
      type: trainingType,
      duration_min: duration_min || null,
      notes: "Apple Watch: " + activity,
    });
    if (error) return NextResponse.json({ error: "db", detail: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, synced: "workout", trainingType, duration_min, date });
  }

  return NextResponse.json({ error: "unknown type — use sleep, weight, or workout" }, { status: 400 });
}
