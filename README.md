# Life OS

A personal life dashboard for Ebin — a property manager who trains jiu jitsu and gym,
tracks food/weight, and wants his week planned around his work shifts. It's a phone-first
web app with a natural-language logging box, automated email briefings, and a weekly
calendar planner.

**Live app:** https://life-os-prosperapropertiess-lgtms-projects.vercel.app
**Repo:** github.com/prosperapropertiess-lgtm/LIFE-OS

---

## How it's wired (the whole picture)

| Piece | What it is | Where it lives |
|---|---|---|
| **Web app** | Next.js 14 (App Router, plain JavaScript — no TypeScript) | this repo |
| **Hosting** | Vercel. Auto-deploys on every push to `main`. | vercel.com |
| **Database** | Supabase Postgres (project `bsdnbmnfswwmzxqfdpsx`) — the brain for all life data | supabase.com |
| **Food macros** | CalorieNinjas API (natural-language nutrition) | api-ninjas.com |
| **Email** | Resend (sends to ebinjaison02@gmail.com) | resend.com |
| **Task sync** | Todoist REST API **v1** (`https://api.todoist.com/api/v1/tasks`) | todoist.com |
| **Calendar / Gmail / Notion** | Read & written by **Claude scheduled tasks** (not by the web app) | the Claude desktop app |

There are two halves:

1. **Always-on cloud** (works whether Ebin's Mac is on or off): the web app + Supabase +
   Vercel cron jobs + Resend emails + Todoist sync.
2. **Claude-app side** (runs only when the Claude desktop app is open): three scheduled
   tasks that use MCP connectors for Google Calendar, Gmail, Supabase, and Todoist.

---

## Database tables (Supabase)

- `training_log` — date, type ('Jiu Jitsu'|'Gym'), duration_min, moves_lifts, notes, energy
- `sleep_log` — date, hours, quality, notes
- `focus_log` — date, hours, notes (property focus hours)
- `tasks` — task, type, due, status ('To Do'|'Doing'|'Done'), notes
- `food_log` — date, raw_text, calories, protein_g, carbs_g, fat_g
- `weight_log` — date, weight_kg, notes
- `weekly_metrics` — week_label, week_start, counts, win, experiment (written by weekly review)
- `week_plan` — week_start, planned_at (tracks whether a week was planned, for the Saturday email)
- `planner` — shifts, notes, photo_url, rundown, feedback, status — powers the Week Planner section

---

## Environment variables (set in Vercel → Settings → Environment Variables)

- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` — database (service key is server-only)
- `CALORIENINJAS_KEY` — food parsing
- `RESEND_API_KEY`, `EMAIL_TO`, `EMAIL_FROM` — email
- `TODOIST_TOKEN` — Todoist sync
- `CRON_SECRET` — protects the cron endpoints
- `APP_URL` — the production URL (used in email buttons)
- `CALORIE_TARGET`, `PROTEIN_TARGET` — optional (default 2500 / 200 in `lib/config.js`)
- `APP_PASSWORD`, `APP_SESSION_TOKEN` — legacy (password login was removed; middleware is now pass-through)

A template is in `.env.example`.

---

## Key files

- `app/page.js` — the dashboard (server component; reads everything via `lib/data.js`)
- `app/QuickAdd.js` — the "Tell me anything" box (food → review/confirm, training, reminders)
- `app/FoodLogger.js` — the "Log food" accordion (parse → review → confirm)
- `app/QuickForm.js` — generic form for training/sleep/focus/weight/task (loading, confirm, clear, undo, duplicate-date errors)
- `app/WeekPlanner.js` — the Week Planner section (drop schedule + notes, shows rundown + feedback)
- `app/globals.css` — the entire design system + animations (light theme, Inter font)
- `lib/data.js` — all dashboard reads + weekly tallies
- `lib/supabase.js` — server-only Supabase client (forced `no-store` so reads are always live)
- `lib/nutrition.js` — CalorieNinjas; `lib/email.js` — Resend; `lib/todoist.js` — Todoist
- `lib/intent.js` + `lib/quickparse.js` — rule-based parsing for the box (to be replaced by Claude)
- `lib/time.js` — all date logic, anchored to America/Toronto
- `app/api/*` — endpoints: `quick-add`, `log`, `log-food`, `parse-food`, `delete-entry`,
  `planner/save`, `planner/feedback`, `plan`, `cron-am`, `cron-pm`, `ping`

---

## Vercel cron jobs (`vercel.json`) — always-on

- `/api/cron-am` (≈7am ET) — emails tasks due today; Saturday: "plan your week" email; keeps DB awake
- `/api/cron-pm` (≈10pm ET) — end-of-day summary email; Saturday: planning nudge if not planned

---

## Claude scheduled tasks (live in the Claude desktop app, NOT this repo)

Stored under `~/Documents/Claude/Scheduled/`. They run when the Claude app is open.

- `morning-briefing` (6:30am daily) — reads Calendar + Supabase + Gmail, sends the day's briefing
- `weekly-review` (Sun 7pm) — reads the week, writes one experiment + a row to `weekly_metrics`
- `weekly-planner` (Sat 11am) — reads the `planner` row, plans the week into Google Calendar, writes the rundown back to `planner`

> These are the only part NOT captured in the repo. To fully reproduce the system, the
> three task prompts must be recreated in the Claude app. Their behavior is summarized above.

---

## How to make changes & deploy

1. Edit code locally (or have an AI agent edit it).
2. Commit and push to the `main` branch of the GitHub repo.
3. Vercel automatically builds and deploys within ~30–60s. A failed build never replaces the
   live site, so it's safe.
4. Env-var changes are made in the Vercel dashboard and require a redeploy to take effect.

Build/run locally: `npm install` then `npm run build` / `npm run dev` (needs the env vars).

---

## Architecture notes / gotchas

- Pages use `export const dynamic = "force-dynamic"` and the Supabase client forces
  `cache: "no-store"` — this is deliberate, to avoid Next.js serving stale data.
- No password: `middleware.js` is a pass-through. The app is private-by-obscure-URL only.
- All dates are computed in America/Toronto via `lib/time.js`. Vercel crons are in **UTC**.
- The web app cannot write to Google Calendar (no OAuth) — that's done by the `weekly-planner`
  Claude task. Same for reading Gmail/Calendar in the briefings.

---

## Roadmap (highest value first)

1. **Claude brain for the box** — replace `lib/intent.js`/`quickparse.js` with a call to the
   Anthropic API so the box understands anything ("one full medium pizza" ≈ 1650 cal) and can
   answer "how's my week?". Needs an `ANTHROPIC_API_KEY`. This is the biggest upgrade.
2. **Photo upload** for the Week Planner (Supabase Storage + vision parsing).
3. **Charts/trends** — weight graph, protein adherence over weeks.
4. **Make briefings/planner always-on** — move them off the Claude app into Vercel cron +
   Anthropic API (requires the calendar-write problem to be solved, e.g. Google OAuth).
5. **Show the Google Calendar inside the dashboard**, not just in emails.
