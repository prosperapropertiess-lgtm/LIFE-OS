"use client";

import { shortDate, todayYMD } from "../../lib/time.js";
import WeekPlanner from "../WeekPlanner.js";
import { completeTask } from "../actions.js";

export default function PlanTab({ d, today }) {
  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 22 }}>
        <div className="hd-date" style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Planning</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, color: "var(--text)" }}>
          Your week
        </div>
      </div>

      {/* Week planner */}
      <WeekPlanner planner={d.planner} />

      {/* Upcoming tasks */}
      {d.upcoming.length > 0 && (
        <>
          <p className="section-label">Coming up</p>
          <div className="card">
            {d.upcoming.slice(0, 8).map((t) => (
              <div className="task" key={t.id}>
                <span className="dot" />
                <div className="body">
                  <p className="t">{t.task}</p>
                  <p className="meta">{t.type}{t.due ? ` · ${shortDate(t.due)}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent training */}
      <p className="section-label">Recent training</p>
      <div className="card">
        {d.recentTraining.length === 0 ? (
          <p className="empty">No sessions yet.</p>
        ) : (
          d.recentTraining.map((r) => (
            <div className="log-line" key={r.id}>
              <span className="moves" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={"pill " + (r.type === "Gym" ? "gym" : "jj")}>
                  {r.type === "Gym" ? "Gym" : "JJ"}
                </span>
                {r.moves_lifts || r.notes || "—"}
              </span>
              <span className="when">{shortDate(r.date)}</span>
            </div>
          ))
        )}
      </div>

      {/* Schedule note */}
      <p className="section-label">Schedule</p>
      <div className="card" style={{ background: "var(--blue-bg)", boxShadow: "var(--shadow-xs), inset 0 0 0 1px rgba(37,99,235,0.08)" }}>
        <h2 style={{ color: "var(--blue-ink)" }}>Work schedule sync</h2>
        <p style={{ fontSize: 14, color: "var(--blue-ink)", lineHeight: 1.6, opacity: 0.75 }}>
          Schedule import coming soon — you'll be able to paste or upload your shifts here and have them flow into your week plan automatically.
        </p>
      </div>

      <div className="foot">
        <p style={{ fontSize: "12px", color: "var(--hint)" }}>Life OS · your day, in one place</p>
      </div>
    </div>
  );
}
