import Anthropic from "@anthropic-ai/sdk";
import { todayYMD } from "./time.js";

// Uses Claude Haiku to classify a freeform message into food / training / task
// and extract structured data. Returns the same shape as classifyIntent() so
// the route can use either interchangeably.
//
// Returns null if ANTHROPIC_API_KEY is not set or the response can't be parsed
// (caller falls back to the rule-based classifier).
export async function claudeClassify(text) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const today = todayYMD();
  const client = new Anthropic({ apiKey: key });

  const prompt = `Today is ${today} (Toronto time, YYYY-MM-DD format).

Classify this message from Ebin (property manager who trains BJJ and gym, tracks food/tasks) and return ONLY a JSON object — no explanation, no markdown.

Message: "${text.replace(/"/g, "'")}"

Rules:
- intent must be exactly one of: "food" | "training" | "task"

food → {"intent":"food","food":"<cleaned food description to pass to a nutrition API>"}
  - Strip filler ("I ate", "had", "just had", "for lunch", etc.) — keep just the food
  - Examples: "ate 3 eggs and toast" → food:"3 eggs toast"
              "had a protein shake with milk" → food:"protein shake with milk"

training → {"intent":"training","type":"Jiu Jitsu"|"Gym","notes":"<session detail or null>"}
  - "Jiu Jitsu" for: bjj, rolled, rolling, sparring, drilling, jits, jiu jitsu, grappling
  - "Gym" for: gym, lifted, lifting, bench, squat, deadlift, press, workout, weights
  - If both mentioned, pick the primary one
  - notes: the moves, lifts, or details — strip "I did", "went to", etc.

task → {"intent":"task","task":"<clear action item>","due":"YYYY-MM-DD or null"}
  - Resolve relative dates to absolute YYYY-MM-DD using today as the base
  - tomorrow → ${todayYMD()} + 1 day
  - next Monday, this Friday, in 3 days, next week → compute the actual date
  - No date mentioned → due: null
  - Strip reminder prefixes ("remind me to", "don't forget to", "task:", etc.)
  - Capitalise first word of task

Return ONLY the JSON object.`;

  let raw = "";
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });
    raw = response.content[0]?.text?.trim() ?? "";
  } catch (e) {
    console.error("[claude-intent] API error:", e.message);
    return null;
  }

  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (!["food", "training", "task"].includes(parsed.intent)) return null;
    return parsed;
  } catch (e) {
    console.error("[claude-intent] Parse error:", raw);
    return null;
  }
}
