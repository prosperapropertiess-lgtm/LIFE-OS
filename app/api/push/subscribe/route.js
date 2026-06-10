import { NextResponse } from "next/server";
import { getSupabase } from "../../../../lib/supabase.js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }

  const { endpoint, keys } = body;
  if (!endpoint || !keys) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  const sb = getSupabase();
  const { error } = await sb
    .from("push_subscriptions")
    .upsert({ endpoint, keys }, { onConflict: "endpoint" });

  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }
  const { endpoint } = body;
  if (!endpoint) return NextResponse.json({ error: "missing_endpoint" }, { status: 400 });

  const sb = getSupabase();
  await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}
