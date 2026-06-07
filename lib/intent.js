import { parseQuickAdd } from "./quickparse.js";

const REMIND_RE = /\b(remind|reminder|don'?t forget|to-?do|task)\b/i;
const JJ_RE = /\b(jiu[\s-]?jitsu|jits|bjj|rolled|rolling|sparred|grappl|drill(ed)?)\b/i;
const GYM_RE = /\b(gym|lift(ed|ing)?|bench|squat|deadlift|press|workout|worked out|reps|sets)\b/i;
const TRAIN_RE = /\b(trained|training|session|class)\b/i;
const FOOD_LEAD = /^(i\s+)?(ate|eat|eaten|had|have|having|drank|drink|drinking)\b/i;
const FOOD_KW = /\b(breakfast|lunch|dinner|snack|protein shake|shake|grams? of|\bg of\b|calories|macros|sandwich|chicken|rice|oats|eggs|whey|banana|salad|burger|pasta|yogurt|smoothie|coffee)\b/i;

// Classify a free-text line into a food log, training log, or task/reminder.
export function classifyIntent(text) {
  const t = (text || "").trim();
  const lower = t.toLowerCase();

  if (REMIND_RE.test(lower)) {
    const p = parseQuickAdd(t);
    return { intent: "task", task: p.task, due: p.due };
  }

  if (JJ_RE.test(lower) || GYM_RE.test(lower) || TRAIN_RE.test(lower)) {
    const type = JJ_RE.test(lower) && !GYM_RE.test(lower) ? "Jiu Jitsu" : (GYM_RE.test(lower) ? "Gym" : "Jiu Jitsu");
    let notes = t
      .replace(/^(i\s+)?(did|logged|log|had|went to|hit|just)\b/i, " ")
      .replace(/\b(today|tonight|this morning|this evening|just now)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^[-–,:\s]+|[-–,:.\s]+$/g, "");
    return { intent: "training", type, notes: notes || null };
  }

  if (
    FOOD_LEAD.test(t) ||
    FOOD_KW.test(lower) ||
    /^(log|logged|track)\s+(a\s+|some\s+|my\s+)?/i.test(lower)
  ) {
    const food = t
      .replace(/^(i\s+)?(ate|eat|eaten|had|have|having|drank|drink|drinking|log|logged|track)\b/i, " ")
      .replace(/^\s*(a|an|some|my)\s+/i, " ")
      .replace(/\bfor (breakfast|lunch|dinner|a snack)\b/gi, " ")
      .replace(/\b(today|just now)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^[-–,:\s]+|[-–,:.\s]+$/g, "");
    return { intent: "food", food: food || t };
  }

  const p = parseQuickAdd(t);
  return { intent: "task", task: p.task, due: p.due };
}
