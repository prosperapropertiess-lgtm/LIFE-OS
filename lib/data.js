import { getSupabase } from "./supabase.js";
import { todayYMD, weekStart } from "./time.js";
import {
  JJ_GOAL,
  GYM_GOAL,
  SLEEP_TARGET,
  CALORIE_TARGET,
  PROTEIN_TARGET,
} from "./config.js";

export async function getDashboard() {
  const sb = getSupabase();
  const today = todayYMD();
  const wkStart = weekStart(today);

  const [training, sleep, focus, tasks, weekly, food, weight, planner] = await Promise.all([
    sb.from("training_log").select("*").order("date", { ascending: false }).limit(50),
    sb.from("sleep_log").select("*").order("date", { ascending: false }).limit(30),
    sb.from("focus_log").select("*").order("date", { ascending: false }).limit(30),
    sb.from("tasks").select("*").order("due", { ascending: true }).limit(100),
    sb.from("weekly_metrics").select("*").order("week_start", { ascending: false }).limit(1),
    sb.from("food_log").select("*").order("created_at", { ascending: false }).limit(40),
    sb.from("weight_log").select("*").order("date", { ascending: false }).limit(30),
    sb.from("planner").select("*").order("created_at", { ascending: false }).limit(1),
  ]);

  const trainingRows = training.data || [];
  const sleepRows = sleep.data || [];
  const focusRows = focus.data || [];
  const taskRows = tasks.data || [];
  const foodRows = food.data || [];
  const weightRows = weight.data || [];

  const thisWeekTraining = trainingRows.filter((r) => r.date >= wkStart && r.date <= today);
  const jjCount = thisWeekTraining.filter((r) => r.type === "Jiu Jitsu").length;
  const gymCount = thisWeekTraining.filter((r) => r.type === "Gym").length;

  const focusHours = focusRows
    .filter((r) => r.date >= wkStart && r.date <= today)
    .reduce((sum, r) => sum + Number(r.hours || 0), 0);

  let streak = 0;
  for (const r of sleepRows) {
    if (Number(r.hours) >= SLEEP_TARGET) streak += 1;
    else break;
  }
  const lastNight = sleepRows[0] || null;

  const openTasks = taskRows.filter((t) => t.status !== "Done");
  const dueNow = openTasks.filter((t) => !t.due || t.due <= today);
  const upcoming = openTasks.filter((t) => t.due && t.due > today);

  const experiment = weekly.data && weekly.data[0] ? weekly.data[0].experiment : null;

  // Today's nutrition totals
  const todayFood = foodRows.filter((r) => r.date === today);
  const nutrition = todayFood.reduce(
    (a, r) => ({
      calories: a.calories + Number(r.calories || 0),
      protein: a.protein + Number(r.protein_g || 0),
      carbs: a.carbs + Number(r.carbs_g || 0),
      fat: a.fat + Number(r.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Weight: latest + trend vs ~7 days back
  const latestWeight = weightRows[0] || null;
  let weightDelta = null;
  if (latestWeight) {
    const cutoff = weightRows.find((r) => r.date <= addDaysStr(latestWeight.date, -7));
    const prior = cutoff || weightRows[weightRows.length - 1];
    if (prior && prior.id !== latestWeight.id) {
      weightDelta = Math.round((Number(latestWeight.weight_kg) - Number(prior.weight_kg)) * 10) / 10;
    }
  }

  const todaySlept = sleepRows[0]?.date === today ? sleepRows[0] : null;
  const todayWeight = weightRows[0]?.date === today ? weightRows[0] : null;

  // Logging streak: consecutive days where at least weight OR food was logged
  const loggedDates = new Set([
    ...weightRows.map((r) => r.date),
    ...foodRows.map((r) => r.date),
  ]);
  let logStreak = 0;
  {
    let check = today;
    while (loggedDates.has(check)) {
      logStreak += 1;
      // step back one day
      const [y, m, d] = check.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d, 12));
      dt.setUTCDate(dt.getUTCDate() - 1);
      check = dt.toISOString().slice(0, 10);
    }
  }

  return {
    today,
    goals: { jj: JJ_GOAL, gym: GYM_GOAL },
    targets: { calories: CALORIE_TARGET, protein: PROTEIN_TARGET },
    jjCount,
    gymCount,
    focusHours: Math.round(focusHours * 10) / 10,
    streak,
    lastNight,
    todaySlept,
    todayWeight,
    dueNow,
    upcoming,
    recentTraining: trainingRows.slice(0, 6),
    experiment,
    nutrition: {
      calories: Math.round(nutrition.calories),
      protein: Math.round(nutrition.protein),
      carbs: Math.round(nutrition.carbs),
      fat: Math.round(nutrition.fat),
      entries: todayFood,
    },
    weight: { latest: latestWeight, delta: weightDelta, recent: weightRows.slice(0, 7) },
    logStreak,
    recentSleep: sleepRows.slice(0, 7),
    weekTraining: thisWeekTraining,
    weekFood: foodRows.filter((r) => r.date >= wkStart && r.date <= today),
    wkStart,
    planner: (planner.data && planner.data[0]) || null,
  };
}

function addDaysStr(ymd, n) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export async function ping() {
  const sb = getSupabase();
  const { error } = await sb.from("tasks").select("id").limit(1);
  return !error;
}

// --- helpers used by the cron email jobs ---

export async function getTasksDueBy(dateStr) {
  const sb = getSupabase();
  const { data } = await sb
    .from("tasks")
    .select("*")
    .neq("status", "Done")
    .lte("due", dateStr)
    .order("due", { ascending: true });
  return data || [];
}

export async function isWeekPlanned(wkStart) {
  const sb = getSupabase();
  const { data } = await sb.from("week_plan").select("week_start").eq("week_start", wkStart).limit(1);
  return !!(data && data.length);
}

export async function markWeekPlanned(wkStart) {
  const sb = getSupabase();
  await sb.from("week_plan").upsert({ week_start: wkStart }, { onConflict: "week_start" });
}
