import { getDashboard } from "../../../lib/data.js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = await getDashboard();
  return NextResponse.json(d);
}
