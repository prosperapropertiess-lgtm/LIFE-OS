import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabase } from "../../../lib/supabase.js";
import { todayYMD, weekStart, addDays } from "../../../lib/time.js";

export const dynamic = "force-dynamic";

function avg(arr) {
  const vals = arr.filter((v) => v != null && !isNaN(v) && v > 0);
  return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
}

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "no_key" }, { status: 500 });

  const sb = getSupabase();
  const today = todayYMD();
  const thirtyAgo = addDays(today, -30);
  const wkStart = weekStart(today);

  // Return cached insights if fresh (same week)
  try {
    const { data: cached } = await sb
      .from("daily_cache")
      .select("insights")
      .eq("date", wkStart)
      .single();
    if (cached?.insights) {
      return NextResponse.json({ ok: true, insights: cached.insights, cached: true });
    }
  } catch {}

  // Fetch 30 days of data
  const [trainingRes, sleepRes, foodRes, weightRes] = await Promise.all([
    sb.from("training_log").select("date, type, duration_min").gte("date", thirtyAgo).order("date"),
    sb.from("sleep_log").select("date, hours, quality").gte("date", thirtyAgo).order("date"),
    sb.from("food_log").select("date, calories, protein_g").gte("date", thirtyAgo),
    sb.from("weight_log").select("date, weight_kg").gte("date", thirtyAgo).order("date"),
  ]);

  const trainRows = trainingRes.data || [];
  const sleepRows = sleepRes.data || [];
  const foodRows = foodRes.data || [];
  const weightRows = weightRes.data || [];

  if (trainRows.length < 3 && sleepRows.length < 3) {
    return NextResponse.json({ ok: true, insights: [], insufficient: true });
  }

  // Build lookup maps
  const sleepByDay = {};
  for (const r of sleepRows) sleepByDay[r.date] = Number(r.hours);

  const calByDay = {};
  for (const r of foodRows) calByDay[r.date] = (calByDay[r.date] || 0) + Number(r.calories || 0);

  const proByDay = {};
  for (const r of foodRows) proByDay[r.date] = (proByDay[r.date] || 0) + Number(r.protein_g || 0);

  const trainingDates = new Set(trainRows.map((r) => r.date));
  const jjDates = new Set(trainRows.filter((r) => r.type === "Jiu Jitsu").map((r) => r.date));
  const gymDates = new Set(trainRows.filter((r) => r.type === "Gym").map((r) => r.date));

  // Sleep the night BEFORE each session type
  const sleepBeforeJJ = [...jjDates].map((d) => sleepByDay[addDays(d, -1)]).filter(Boolean);
  const sleepBeforeGym = [...gymDates].map((d) => sleepByDay[addDays(d, -1)]).filter(Boolean);
  const sleepOnRest = Object.entries(sleepByDay)
    .filter(([d]) => !trainingDates.has(d))
    .map(([, h]) => h);

  // Calories: training days vs rest days
  const calsTraining = [...trainingDates].map((d) => calByDay[d]).filter((v) => v > 0);
  const calsRest = Object.entries(calByDay)
    .filter(([d]) => !trainingDates.has(d))
    .map(([, v]) => v)
    .filter((v) => v > 0);

  // Session duration after good sleep vs poor sleep
  const goodSleepSessions = trainRows.filter((r) => (sleepByDay[addDays(r.date, -1)] || 0) >= 7.5 && r.duration_min);
  const poorSleepSessions = trainRows.filter((r) => {
    const s = sleepByDay[addDays(r.date, -1)];
    return s && s < 6.5 && r.duration_min;
  });

  // Protein on training vs rest days
  const proteinTraining = [...trainingDates].map((d) => proByDay[d]).filter((v) => v > 0);
  const proteinRest = Object.entries(proByDay)
    .filter(([d]) => !trainingDates.has(d))
    .map(([, v]) => v)
    .filter((v) => v > 0);

  // Weight trend
  const weightStart = weightRows[0] ? Number(weightRows[0].weight_kg) : null;
  const weightNow = weightRows[weightRows.length - 1] ? Number(weightRows[weightRows.length - 1].weight_kg) : null;
  const weightChange = weightStart && weightNow ? Math.round((weightNow - weightStart) * 10) / 10 : null;

  // Build stats object for Claude
  const stats = {
    days_of_data: 30,
    training: {
      total_sessions: trainRows.length,
      jj_sessions: jjDates.size,
      gym_sessions: gymDates.size,
      avg_duration_min: avg(trainRows.map((r) => Number(r.duration_min)).filter(Boolean)),
      avg_duration_after_good_sleep_min: avg(goodSleepSessions.map((r) => Number(r.duration_min))),
      avg_duration_after_poor_sleep_min: avg(poorSleepSessions.map((r) => Number(r.duration_min))),
    },
    sleep: {
      avg_before_jj: avg(sleepBeforeJJ),
      avg_before_gym: avg(sleepBeforeGym),
      avg_on_rest_days: avg(sleepOnRest),
      nights_logged: sleepRows.length,
    },
    nutrition: {
      avg_calories_training_days: avg(calsTraining),
      avg_calories_rest_days: avg(calsRest),
      avg_protein_training_days: avg(proteinTraining),
      avg_protein_rest_days: avg(proteinRest),
      days_with_food_logged: Object.keys(calByDay).length,
    },
    weight: {
      start_kg: weightStart,
      current_kg: weightNow,
      change_kg: weightChange,
      entries: weightRows.length,
    },
  };

  const prompt = `Analyze Ebin's personal health data from the last 30 days. Find exactly 3 real, specific patterns. Only state patterns where the numbers are meaningfully different (10%+ difference or notable trend). Skip generic health advice.

Data:
${JSON.stringify(stats, null, 2)}

Return a JSON array with exactly 3 objects. Each must use actual numbers from the data.
Format: [{"icon":"<1 emoji>","title":"<4-5 words>","body":"<1-2 sentences citing specific numbers>"}]

Good examples of the tone:
- "You log 340 more calories on training days — but protein only goes up 18g."
- "After 7.5h+ sleep, your sessions run 23 min longer than after poor sleep."
- "Your JJ sessions averaged 82 min, gym only 54 — you push harder on the mat."

Return ONLY the JSON array, no markdown, no explanation.`;

  const client = new Anthropic({ apiKey: key });
  let insights = [];
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = response.content[0]?.text?.trim() || "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) insights = JSON.parse(match[0]);
  } catch (e) {
    return NextResponse.json({ error: "claude_failed" }, { status: 500 });
  }

  // Cache keyed to the current week start (refresh weekly)
  try {
    await sb.from("daily_cache").upsert({ date: wkStart, insights }, { onConflict: "date" });
  } catch {}

  return NextResponse.json({ ok: true, insights });
}
