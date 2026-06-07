// All date logic is anchored to Ebin's timezone so "today" and "this week"
// are correct no matter where the server runs.
const TZ = "America/Toronto";

// Returns today's date in Toronto as "YYYY-MM-DD".
export function todayYMD() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Parse a "YYYY-MM-DD" string into a UTC-noon Date (avoids tz off-by-one).
function parseYMD(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function addDays(ymd, n) {
  const dt = parseYMD(ymd);
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

// Monday-based start of the week containing the given date.
export function weekStart(ymd) {
  const dt = parseYMD(ymd);
  const dow = dt.getUTCDay(); // 0 Sun .. 6 Sat
  const back = dow === 0 ? 6 : dow - 1;
  return addDays(ymd, -back);
}

// "Friday, June 5" style label for a YYYY-MM-DD.
export function prettyDate(ymd) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(parseYMD(ymd));
}

// "Jun 5" short label.
export function shortDate(ymd) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
  }).format(parseYMD(ymd));
}

// Greeting based on Toronto local hour.
export function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hour: "numeric",
      hour12: false,
    }).format(new Date())
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Short weekday name for today in Toronto, e.g. "Sat".
export function todayWeekday() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(new Date());
}

export function isWorkChecklistDay() {
  // The pre-work checklist always shows; the briefing decides shift days.
  return true;
}
