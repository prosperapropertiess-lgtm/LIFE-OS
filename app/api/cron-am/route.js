import { NextResponse } from "next/server";
import { getTasksDueBy } from "../../../lib/data.js";
import { sendEmail, emailShell } from "../../../lib/email.js";
import { todayYMD, weekStart, addDays, todayWeekday, prettyDate, shortDate } from "../../../lib/time.js";

export const dynamic = "force-dynamic";

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // not configured → allow
  return request.headers.get("authorization") === "Bearer " + secret;
}

function appUrl(request) {
  return process.env.APP_URL || new URL(request.url).origin;
}

export async function GET(request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const today = todayYMD();
  const base = appUrl(request);
  const results = {};

  // 1) Daily task reminder — anything due today or overdue.
  const due = await getTasksDueBy(today);
  if (due.length > 0) {
    const rows = due
      .map((t) => {
        const overdue = t.due && t.due < today;
        const meta = (t.type || "Task") + (t.due ? " · due " + shortDate(t.due) : "");
        return `<li style="margin-bottom:8px;">${t.task} <span style="color:${overdue ? "#c2433f" : "#9aa1ab"};font-size:13px;">(${overdue ? "overdue · " : ""}${meta})</span></li>`;
      })
      .join("");
    const html = emailShell(
      "Today's tasks",
      `<p>Here's what's on your plate for ${prettyDate(today)}:</p><ul style="padding-left:18px;margin:12px 0;">${rows}</ul>`,
      base,
      "Open dashboard"
    );
    results.tasks = await sendEmail(`Life OS — ${due.length} task${due.length > 1 ? "s" : ""} for today`, html);
  } else {
    results.tasks = "none due";
  }

  // 2) Saturday morning — plan the week.
  if (todayWeekday() === "Sat") {
    const nextMonday = weekStart(addDays(today, 7));
    const planUrl = `${base}/api/plan?week=${nextMonday}`;
    const html = emailShell(
      "Time to plan your week",
      `<p>It's Saturday — let's set up next week before it sets you up.</p>
       <p>Hand Claude your Superstore shifts, and your jiu jitsu, gym, property focus, and rest day get placed around them. Then tap below to review your dashboard.</p>`,
      planUrl,
      "Plan my week →"
    );
    results.plan = await sendEmail("Life OS — time to plan your week", html);
  }

  return NextResponse.json({ ok: true, date: today, ...results });
}
