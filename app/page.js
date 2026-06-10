import Shell from "./Shell.js";

// Page is now a static shell — data is fetched client-side via /api/dashboard
// so the HTML is served from CDN/SW cache instantly with no database wait.
export default function Dashboard() {
  return <Shell />;
}
