import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase.js";
import { isWeekPlanned } from "../../../lib/data.js";
import { sendEmail, emailShell } from "../../../lib/email.js";
import { sendPush } from "../../../lib/push.js";
import { todayYMD, weekStart, addDays, todayWeekday, prettyDate, shortDate } from "../../../lib/time.js";
import { CALORIE_TARGET, PROTEIN_TARGET, JJ_GOAL, GYM_GOAL } from "../../../lib/config.js";

export const dynamic = "force-dynamic";

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === "Bearer " + secret;
}
function appUrl(request) {
  return process.env.APP_URL || new URL(request.url).origin;
}

async function dailySummary(request) {
  const sb = getSupabase();
  const today = todayYMD();
  const tomorrow = addDays(today, 1);

  const [training, focus, food, sleep, dueTomorrow] = await Promise.all([
    sb.from("training_log").select("*").eq("date", today),
    sb.from("focus_log").select("hours").eq("date", today),
    sb.from("food_log").select("calories, protein_g").eq("date", today),
    sb.from("sleep_log").select("hours, quality").eq("date", today).limit(1),
    sb.from("tasks").select("task, due, type").neq("status", "Done").lte("due", tomorrow).order("due", { ascending: true }),
  ]);

  const tRows = training.data || [];
  const jj = tRows.filter((r) => r.type === "Jiu Jitsu").length;
  const gym = tRows.filter((r) => r.type === "Gym").length;
  const learnings = tRows.map((r) => r.moves_lifts).filter(Boolean);
  const focusHrs = (focus.data || []).reduce((s, r) => s + Number(r.hours || 0), 0);
  const cal = Math.round((food.data || []).reduce((s, r) => s + Number(r.calories || 0), 0));
  const protein = Math.round((food.data || []).reduce((s, r) => s + Number(r.protein_g || 0), 0));
  const sleepRow = (sleep.data || [])[0];

  const did = [];
  if (jj) did.push(`${jj} jiu jitsu session${jj > 1 ? "s" : ""}`);
  if (gym) did.push(`${gym} gym session${gym > 1 ? "s" : ""}`);
  if (focusHrs) did.push(`${Math.round(focusHrs * 10) / 10} hrs of property focus`);
  if (cal) did.push(`${protein}g protein · ${cal} cal (target ${PROTEIN_TARGET}g · ${CALORIE_TARGET})`);

  let body = `<p>Here's how ${prettyDate(today)} went.</p>`;
  body += did.length
    ? `<p style="margin:10px 0 4px;"><b>What you got done</b></p><ul style="padding-left:18px;margin:4px 0;">${did.map((x) => `<li style="margin-bottom:6px;">${x}</li>`).join("")}</ul>`
    : `<p>Quiet day on the logs — nothing recorded. Tomorrow's a fresh start.</p>`;

  if (learnings.length) {
    body += `<p style="margin:12px 0 4px;"><b>Learnings</b></p><ul style="padding-left:18px;margin:4px 0;">${learnings.map((x) => `<li style="margin-bottom:6px;">${x}</li>`).join("")}</ul>`;
  }
  if (sleepRow) {
    body += `<p style="margin:12px 0 0;">Sleep last night: <b>${sleepRow.hours}h</b>${sleepRow.quality ? ` (${sleepRow.quality})` : ""}.</p>`;
  }

  const due = dueTomorrow.data || [];
  if (due.length) {
    body += `<p style="margin:14px 0 4px;"><b>On deck for tomorrow</b></p><ul style="padding-left:18px;margin:4px 0;">${due
      .map((t) => `<li style="margin-bottom:6px;">${t.task}${t.due ? ` <span style="color:#9aa1ab;">(${shortDate(t.due)})</span>` : ""}</li>`)
      .join("")}</ul>`;
  }
  body += `<p style="margin:14px 0 0;">Rest up — momentum compounds.</p>`;

  const html = emailShell("Your day, wrapped", body, appUrl(request), "Open dashboard");
  return sendEmail(`Life OS — your day, wrapped (${shortDate(today)})`, html);
}

export async function GET(request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const results = {};

  results.summary = await dailySummary(request);

  // Push: nudge if no food logged today
  const sb2 = getSupabase();
  const { data: todayFood } = await sb2.from("food_log").select("id").eq("date", todayYMD()).limit(1);
  if (!todayFood || todayFood.length === 0) {
    results.push = await sendPush(
      "Haven't logged today 🍽️",
      "Tap to log your food — takes 20 seconds.",
      "/"
    );
  }

  if (todayWeekday() === "Sat") {
    const nextMonday = weekStart(addDays(todayYMD(), 7));
    if (!(await isWeekPlanned(nextMonday))) {
      const base = appUrl(request);
      const planUrl = `${base}/api/plan?week=${nextMonday}`;
      const html = emailShell(
        "Don't forget to plan your week",
        `<p>Quick nudge — you haven't planned next week yet. Two minutes now saves a scattered week later.</p>`,
        planUrl,
        "Plan my week →"
      );
      results.nudge = await sendEmail("Life OS — plan your week (evening nudge)", html);
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
