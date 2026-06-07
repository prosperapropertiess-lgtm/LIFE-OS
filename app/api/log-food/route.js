import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase.js";
import { todayYMD } from "../../../lib/time.js";

export const dynamic = "force-dynamic";

// Saves a food entry with the final (possibly user-edited) macros.
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }

  const raw = (body.raw_text || "").toString().trim();
  if (!raw) return NextResponse.json({ error: "empty" }, { status: 400 });

  const num = (v) => {
    const n = Number(String(v == null ? "" : v).replace(/,/g, ".").trim());
    return Number.isFinite(n) ? n : 0;
  };

  const sb = getSupabase();
  const { data, error } = await sb.from("food_log").insert({
    date: (body.date || todayYMD()).toString().slice(0, 10),
    raw_text: raw,
    calories: num(body.calories),
    protein_g: num(body.protein_g),
    carbs_g: num(body.carbs_g),
    fat_g: num(body.fat_g),
  }).select("id").single();
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
