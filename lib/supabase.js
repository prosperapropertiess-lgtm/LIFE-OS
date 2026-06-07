import { createClient } from "@supabase/supabase-js";

// Server-only client. The service key has full access, so this module must
// never be imported into client components — only server components, actions,
// and route handlers.
let cached = null;

export function getSupabase() {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars.");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Never let Next.js cache database reads — always fetch live data.
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  return cached;
}
