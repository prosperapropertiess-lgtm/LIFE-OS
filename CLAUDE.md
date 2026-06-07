# Context for AI agents working on this repo

Read `README.md` first — it has the full architecture. This file is the quick brief for an
AI coding agent (Claude Code, Cursor, a new Claude session) taking over.

## What this is
A Next.js 14 (App Router, **plain JavaScript, no TypeScript**) personal dashboard for one user
(Ebin), deployed on Vercel, backed by Supabase Postgres. Phone-first, light theme, Inter font.

## Conventions — follow these
- **No TypeScript.** Files are `.js`. Don't add a tsconfig or convert.
- **No new dependencies** unless necessary. Current deps: `next`, `react`, `react-dom`,
  `@supabase/supabase-js`. Keep it minimal.
- **Styling** is one file: `app/globals.css`. Reuse existing classes/variables (`--accent`,
  `--card`, `.card`, `.stat`, `.bar`, `.flash`, `.qa-spin`, etc.). Light theme only.
- **Dates**: always use helpers in `lib/time.js` (America/Toronto). Never `new Date()` math
  for "today"/"this week".
- **DB reads**: go through `lib/data.js` and the server-only client in `lib/supabase.js`
  (which forces `cache: "no-store"`). Pages must stay `export const dynamic = "force-dynamic"`.
- **Server vs client**: `app/page.js` is a server component. Interactive pieces
  (`QuickAdd`, `QuickForm`, `FoodLogger`, `WeekPlanner`) are `"use client"` and talk to
  `app/api/*` routes via `fetch`, then call `router.refresh()`.
- **Secrets** are env vars in Vercel, never in code. `SUPABASE_SERVICE_KEY` is server-only —
  never import `lib/supabase.js` into a client component.

## How to ship a change
1. Edit code. 2. `npm run build` to sanity-check. 3. Commit + push to `main`.
4. Vercel auto-deploys. Failed builds don't replace the live site.

## Things that are NOT in this repo
- The three **Claude scheduled tasks** (`morning-briefing`, `weekly-review`, `weekly-planner`)
  live in the Claude desktop app and use MCP connectors (Google Calendar, Gmail, Supabase,
  Todoist). The web app does not and cannot write to Google Calendar directly.
- Database schema changes are applied directly in Supabase (SQL editor or the Supabase MCP),
  not via repo migrations. If you add a table/column, update `README.md`.

## The #1 planned upgrade
Replace the rule-based parser (`lib/intent.js`, `lib/quickparse.js`) with a call to the
Anthropic API (`ANTHROPIC_API_KEY`, server-side, in `app/api/quick-add`) so the box can
understand any phrasing and answer questions. Keep the same request/response shape the
client (`app/QuickAdd.js`) already expects: `{ ok, intent, food, calories, ... }` for food
previews and `{ ok, kind, id, verb, label }` for saved items.
