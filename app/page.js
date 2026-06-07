import { getDashboard } from "../lib/data.js";
import { todayYMD } from "../lib/time.js";
import Shell from "./Shell.js";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function Dashboard() {
  const d = await getDashboard();
  const today = todayYMD();
  return <Shell d={d} today={today} />;
}
