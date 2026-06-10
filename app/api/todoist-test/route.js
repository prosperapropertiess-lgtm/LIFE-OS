import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = process.env.TODOIST_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "TODOIST_TOKEN not set in Vercel env vars" });
  }
  try {
    const res = await fetch("https://api.todoist.com/rest/v2/tasks?limit=1", {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store",
    });
    const body = await res.json();
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      tokenPrefix: token.slice(0, 8) + "...",
      sample: res.ok ? body.slice(0, 1) : body,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
