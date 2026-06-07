import { todayYMD, addDays } from "./time.js";

const DOW = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3, thursday: 4, thu: 4, thurs: 4, friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

function dowOf(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

// Turns "remind me to buy milk tomorrow" into { task: "Buy milk", due: <date> }.
export function parseQuickAdd(input) {
  const raw = (input || "").trim();
  let text = " " + raw + " ";
  const lower = raw.toLowerCase();
  const today = todayYMD();
  let due = null;
  let m;

  const strip = (re) => { text = text.replace(re, " "); };

  if ((m = lower.match(/\bin (\d+)\s*days?\b/))) {
    due = addDays(today, parseInt(m[1], 10)); strip(/\bin \d+\s*days?\b/i);
  } else if ((m = lower.match(/\bin (\d+)\s*weeks?\b/))) {
    due = addDays(today, parseInt(m[1], 10) * 7); strip(/\bin \d+\s*weeks?\b/i);
  } else if (/\btomorrow\b/.test(lower)) {
    due = addDays(today, 1); strip(/\btomorrow\b/i);
  } else if (/\btonight\b|\btoday\b|\blater\b/.test(lower)) {
    due = today; strip(/\btonight\b|\btoday\b|\blater\b/i);
  } else if (/\bnext week\b/.test(lower)) {
    due = addDays(today, 7); strip(/\bnext week\b/i);
  } else if (/\b(this )?weekend\b/.test(lower)) {
    const cur = dowOf(today);
    const add = cur === 6 ? 0 : (6 - cur + 7) % 7;
    due = addDays(today, add); strip(/\b(this )?weekend\b/i);
  } else {
    for (const [name, idx] of Object.entries(DOW)) {
      const re = new RegExp("\\b(on |next |this )?" + name + "\\b", "i");
      if (re.test(lower)) {
        const cur = dowOf(today);
        let add = (idx - cur + 7) % 7;
        if (add === 0) add = 7;
        due = addDays(today, add);
        strip(re);
        break;
      }
    }
  }

  text = text.replace(
    /\b(remind me to|remind me|reminder to|reminder|remember to|don't forget to|dont forget to|please|i need to|i have to|i gotta|gotta|need to|add a task to|add a task|add task to|add task|add a reminder to|add reminder|new task|task to|task:|todo:|to-do:|note to)\b/gi,
    " "
  );
  text = text.replace(/\s+(by|on|at|for|to)\s*$/i, " ");

  let task = text.replace(/\s+/g, " ").trim().replace(/^[-–:,\s]+|[-–:,.;\s]+$/g, "");
  if (task) task = task.charAt(0).toUpperCase() + task.slice(1);

  return { task: task || raw, due, type: "Reminder" };
}
