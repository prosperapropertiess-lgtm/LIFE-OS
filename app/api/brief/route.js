import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabase } from "../../../lib/supabase.js";
import { todayYMD, weekStart, addDays } from "../../../lib/time.js";
import { JJ_GOAL, GYM_GOAL, SLEEP_TARGET } from "../../../lib/config.js";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "no_key" }, { status: 500 });

  const sb = getSupabase();
  const today = todayYMD();
  const wkStart = weekStart(today);

  // Return cached brief if it exists for today
  try {
    const { data: cached } = await sb
      .from("daily_cache")
      .select("brief")
      .eq("date", today)
      .single();
    if (cached?.brief) {
      return NextResponse.json({ ok: true, brief: cached.brief, cached: true });
    }
  } catch {}

  // Fetch all data needed for brief
  const [sleepRes, weightRes, trainingRes, tasksRes, foodRes] = await Promise.all([
    sb.from("sleep_log").select("hours, quality").order("date", { ascending: false }).limit(1),
    sb.from("weight_log").select("weight_kg, date").order("date", { ascending: false }).limit(2),
    sb.from("training_log").select("type, duration_min").gte("date", wkStart).lte("date", today),
    sb.from("tasks").select("task, due, type").neq("status", "Done").lte("due", today).order("due", { ascending: true }).limit(5),
    sb.from("food_log").select("calories, protein_g").eq("date", today),
  ]);

  const lastSleep = sleepRes.data?.[0];
  const latestWeight = weightRes.data?.[0];
  const prevWeight = weightRes.data?.[1];
  const trainRows = trainingRes.data || [];
  const jj = trainRows.filter((r) => r.type === "Jiu Jitsu").length;
  const gym = trainRows.filter((r) => r.type === "Gym").length;
  const overdue = tasksRes.data || [];
  const todayCalories = Math.round((foodRes.data || []).reduce((s, r) => s + Number(r.calories || 0), 0));

  const weightDelta = latestWeight && prevWeight
    ? (Number(latestWeight.weight_kg) - Number(prevWeight.weight_kg)).toFixed(1)
    : null;

  const dow = new Date(today + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long", timeZone: "America/Toronto",
  });
  const daysIntoWeek = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].indexOf(dow);
  const daysLeft = 7 - (daysIntoWeek >= 0 ? daysIntoWeek : 0);
  const jjNeeded = Math.max(0, JJ_GOAL - jj);
  const gymNeeded = Math.max(0, GYM_GOAL - gym);

  const sleepStatus = lastSleep
    ? `${lastSleep.hours}h${lastSleep.quality ? ` (${lastSleep.quality})` : ""} — ${Number(lastSleep.hours) >= SLEEP_TARGET ? "on target" : `${(SLEEP_TARGET - Number(lastSleep.hours)).toFixed(1)}h under target`}`
    : "not logged";

  const weightStatus = latestWeight
    ? `${latestWeight.weight_kg}kg${weightDelta !== null ? `, ${Number(weightDelta) > 0 ? "+" : ""}${weightDelta}kg since last entry` : ""}`
    : "not logged today";

  const trainingStatus = `${jj} JJ + ${gym} gym this week (goal: ${JJ_GOAL} JJ, ${GYM_GOAL} gym). ${
    jjNeeded > 0 || gymNeeded > 0
      ? `Still need: ${[jjNeeded > 0 ? `${jjNeeded} JJ` : "", gymNeeded > 0 ? `${gymNeeded} gym` : ""].filter(Boolean).join(", ")} with ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left.`
      : "All training goals hit."
  }`;

  const overdueStatus = overdue.length > 0
    ? overdue.slice(0, 3).map((t) => t.task).join("; ")
    : "none";

  const prompt = `Today is ${dow}, ${today}.

Ebin's data:
- Sleep last night: ${sleepStatus}
- Weight: ${weightStatus}
- Training this week: ${trainingStatus}
- Calories logged today: ${todayCalories > 0 ? `${todayCalories} cal` : "nothing yet"}
- Overdue tasks: ${overdueStatus}

Write a morning brief. Rules:
- Exactly 3 sentences, no bullet points, no markdown
- Do NOT start with "Good morning" or any greeting — start with the most important signal
- Sentence 1: key health signal (sleep quality or weight trend, whichever is more notable)
- Sentence 2: honest training status — be direct about urgency if goals are at risk this late in the week
- Sentence 3: one concrete action to take today
- Tone: direct, warm, like a trusted coach who knows your numbers cold`;

  const client = new Anthropic({ apiKey: key });
  let brief = "";
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 180,
      messages: [{ role: "user", content: prompt }],
    });
    brief = response.content[0]?.text?.trim() || "";
  } catch (e) {
    return NextResponse.json({ error: "claude_failed", message: e.message }, { status: 500 });
  }

  // Cache for the day
  try {
    await sb.from("daily_cache").upsert({ date: today, brief }, { onConflict: "date" });
  } catch {}

  return NextResponse.json({ ok: true, brief });
}
