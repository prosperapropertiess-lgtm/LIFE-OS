import { NextResponse } from "next/server";
import { markWeekPlanned } from "../../../lib/data.js";
import { weekStart, todayYMD, addDays } from "../../../lib/time.js";

export const dynamic = "force-dynamic";

// Hit from the Saturday planning email button. Marks the upcoming week as
// "planned" so the evening nudge knows not to fire, then sends Ebin to his dashboard.
export async function GET(request) {
  const url = new URL(request.url);
  const week = url.searchParams.get("week") || weekStart(addDays(todayYMD(), 7));
  try {
    await markWeekPlanned(week);
  } catch (e) {}
  return NextResponse.redirect(new URL("/", request.url));
}
