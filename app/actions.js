"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "../lib/supabase.js";
import { todayYMD } from "../lib/time.js";
import { parseFood } from "../lib/nutrition.js";

function clean(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

// Parse a number that may use a comma or dot as the decimal separator.
function numf(v) {
  if (v == null) return null;
  const n = Number(String(v).replace(/,/g, ".").trim());
  return Number.isFinite(n) ? n : null;
}

export async function addTraining(formData) {
  const sb = getSupabase();
  await sb.from("training_log").insert({
    date: clean(formData.get("date")) || todayYMD(),
    type: formData.get("type") || "Jiu Jitsu",
    duration_min: clean(formData.get("duration_min")) ? Number(formData.get("duration_min")) : null,
    moves_lifts: clean(formData.get("moves_lifts")),
    notes: clean(formData.get("notes")),
    energy: clean(formData.get("energy")),
  });
  revalidatePath("/");
}

export async function addSleep(formData) {
  const sb = getSupabase();
  await sb.from("sleep_log").insert({
    date: clean(formData.get("date")) || todayYMD(),
    hours: numf(formData.get("hours")),
    quality: clean(formData.get("quality")),
    notes: clean(formData.get("notes")),
  });
  revalidatePath("/");
}

export async function addFocus(formData) {
  const sb = getSupabase();
  await sb.from("focus_log").insert({
    date: clean(formData.get("date")) || todayYMD(),
    hours: numf(formData.get("hours")) ?? 0,
    notes: clean(formData.get("notes")),
  });
  revalidatePath("/");
}

export async function addTask(formData) {
  const sb = getSupabase();
  await sb.from("tasks").insert({
    task: clean(formData.get("task")) || "Untitled",
    type: clean(formData.get("type")) || "To-do",
    due: clean(formData.get("due")),
    status: "To Do",
    notes: clean(formData.get("notes")),
  });
  revalidatePath("/");
}

export async function completeTask(formData) {
  const sb = getSupabase();
  const id = formData.get("id");
  if (id) await sb.from("tasks").update({ status: "Done" }).eq("id", id);
  revalidatePath("/");
}

export async function addFood(formData) {
  const text = clean(formData.get("text"));
  if (!text) return;
  const sb = getSupabase();
  let macros = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  try {
    const parsed = await parseFood(text);
    macros = {
      calories: parsed.calories,
      protein_g: parsed.protein_g,
      carbs_g: parsed.carbs_g,
      fat_g: parsed.fat_g,
    };
  } catch (e) {
    // If parsing fails, still log the text with zero macros so nothing is lost.
  }
  await sb.from("food_log").insert({
    date: clean(formData.get("date")) || todayYMD(),
    raw_text: text,
    ...macros,
  });
  revalidatePath("/");
}

export async function addWeight(formData) {
  const sb = getSupabase();
  const w = numf(formData.get("weight_kg"));
  if (w == null) return;
  await sb.from("weight_log").insert({
    date: clean(formData.get("date")) || todayYMD(),
    weight_kg: w,
    notes: clean(formData.get("notes")),
  });
  revalidatePath("/");
}
