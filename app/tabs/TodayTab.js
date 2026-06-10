"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { greeting, prettyDate, shortDate } from "../../lib/time.js";
import { completeTask } from "../actions.js";

function pct(n, goal) {
  return Math.min(100, Math.round((n / goal) * 100));
}

// 7-point sparkline from sleep data
function Sparkline({ data }) {
  if (!data || data.length < 2) return null;
  const W = 100, H = 30;
  const vals = data.map((v) => Number(v) || 0);
  const min = Math.min(...vals) - 0.5;
  const max = Math.max(...vals) + 0.5;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / (max - min)) * H;
    return `${x},${y}`;
  });
  const d = `M${pts.join(" L")}`;
  return (
    <svg className="sparkline" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Before you leave checklist ──────────────────────────────

const LEAVE_ITEMS = [
  "Keys",
  "ID card",
  "Door access card",
  "Box cutter",
  "Lunch",
  "A pen",
  "Lock the door",
];

function LeaveChecklist() {
  const todayKey = `checklist-${new Date().toLocaleDateString("en-CA")}`;
  const [checked, setChecked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(todayKey) || "[]");
    } catch { return []; }
  });

  function toggle(item) {
    setChecked((prev) => {
      const next = prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item];
      try { localStorage.setItem(todayKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const allDone = checked.length === LEAVE_ITEMS.length;

  return (
    <div className={`card checklist-interactive${allDone ? " all-done" : ""}`}>
      <div className="cl-header">
        <h2>Before you leave</h2>
        {allDone && <span className="cl-badge">All set ✓</span>}
      </div>
      <div className="cl-items">
        {LEAVE_ITEMS.map((item) => {
          const done = checked.includes(item);
          return (
            <button
              key={item}
              type="button"
              className={`cl-item${done ? " done" : ""}`}
              onClick={() => toggle(item)}
            >
              <span className="cl-box">{done ? "✓" : ""}</span>
              <span className="cl-label">{item}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Compact quick-log bar ────────────────────────────────────

function QuickLogBar({ todayWeight, todaySlept, today }) {
  const router = useRouter();

  // Weight state
  const [wLogged, setWLogged] = useState(!!todayWeight);
  const [wVal, setWVal] = useState(todayWeight ? String(todayWeight.weight_kg) : "");
  const [wOpen, setWOpen] = useState(false);
  const [wBusy, setWBusy] = useState(false);
  const [wErr, setWErr] = useState(null);

  // Sleep state
  const [sLogged, setSLogged] = useState(!!todaySlept);
  const [sVal, setSVal] = useState(todaySlept ? String(todaySlept.hours) : "");
  const [sOpen, setSOpen] = useState(false);
  const [sBusy, setSBusy] = useState(false);
  const [sErr, setSErr] = useState(null);

  async function saveWeight() {
    if (!wVal.trim() || wBusy) return;
    setWBusy(true); setWErr(null);
    try {
      const r = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "weight", weight_kg: wVal, date: today }),
      });
      const data = await r.json();
      if (r.ok && data.ok) {
        setWLogged(true); setWOpen(false); router.refresh();
      } else {
        setWErr(data.message || "Couldn't save.");
      }
    } catch { setWErr("Try again."); }
    finally { setWBusy(false); }
  }

  async function saveSleep() {
    if (!sVal.trim() || sBusy) return;
    setSBusy(true); setSErr(null);
    try {
      const r = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "sleep", hours: sVal, quality: "Good", date: today }),
      });
      const data = await r.json();
      if (r.ok && data.ok) {
        setSLogged(true); setSOpen(false); router.refresh();
      } else {
        setSErr(data.message || "Couldn't save.");
      }
    } catch { setSErr("Try again."); }
    finally { setSBusy(false); }
  }

  return (
    <div className="ql-bar">
      {/* Weight chip */}
      <div className="ql-chip-wrap">
        <button
          type="button"
          className={`ql-chip${wLogged ? " done" : ""}`}
          onClick={() => !wLogged && setWOpen((o) => !o)}
        >
          <span className="ql-icon">⚖️</span>
          <span className="ql-text">
            {wLogged ? `${wVal} kg` : "Log weight"}
          </span>
          {wLogged && <span className="ql-check">✓</span>}
        </button>
        {wOpen && !wLogged && (
          <div className="ql-form">
            <input
              className="ql-input"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 82.5"
              value={wVal}
              onChange={(e) => setWVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveWeight()}
              autoFocus
            />
            <button type="button" className="ql-save" onClick={saveWeight} disabled={!wVal.trim() || wBusy}>
              {wBusy ? <span className="qa-spin sm" /> : "Save"}
            </button>
          </div>
        )}
        {wErr && <p className="ql-err">{wErr}</p>}
      </div>

      {/* Sleep chip */}
      <div className="ql-chip-wrap">
        <button
          type="button"
          className={`ql-chip${sLogged ? " done" : ""}`}
          onClick={() => !sLogged && setSOpen((o) => !o)}
        >
          <span className="ql-icon">😴</span>
          <span className="ql-text">
            {sLogged ? `${sVal}h sleep` : "Log sleep"}
          </span>
          {sLogged && <span className="ql-check">✓</span>}
        </button>
        {sOpen && !sLogged && (
          <div className="ql-form">
            <input
              className="ql-input"
              type="text"
              inputMode="decimal"
              placeholder="hours, e.g. 7.5"
              value={sVal}
              onChange={(e) => setSVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveSleep()}
              autoFocus
            />
            <button type="button" className="ql-save" onClick={saveSleep} disabled={!sVal.trim() || sBusy}>
              {sBusy ? <span className="qa-spin sm" /> : "Save"}
            </button>
          </div>
        )}
        {sErr && <p className="ql-err">{sErr}</p>}
      </div>
    </div>
  );
}

function ExperimentCard({ experiment }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(experiment || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function save() {
    if (!val.trim() || busy) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/set-experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experiment: val }),
      });
      const data = await r.json();
      if (r.ok && data.ok) { setEditing(false); router.refresh(); }
      else setErr("Couldn't save.");
    } catch { setErr("Try again."); }
    finally { setBusy(false); }
  }

  return (
    <div className="card experiment">
      <div className="exp-header">
        <h2>This week&apos;s experiment</h2>
        {!editing && (
          <button type="button" className="exp-edit-btn" onClick={() => { setVal(experiment || ""); setEditing(true); }}>
            {experiment ? "Edit" : "Set"}
          </button>
        )}
      </div>
      {editing ? (
        <div className="exp-form">
          <input
            className="exp-input"
            type="text"
            placeholder="e.g. No phone before 8am"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            autoFocus
          />
          <div className="exp-actions">
            <button type="button" className="ql-save" onClick={save} disabled={!val.trim() || busy}>
              {busy ? <span className="qa-spin sm" /> : "Save"}
            </button>
            <button type="button" className="ghost-btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
          {err && <p className="ql-err">{err}</p>}
        </div>
      ) : experiment ? (
        <p>{experiment}</p>
      ) : (
        <p className="exp-placeholder">No experiment set — tap Set to add your focus for this week.</p>
      )}
    </div>
  );
}

// ── Day briefing ────────────────────────────────────────────

function typeIcon(type) {
  switch ((type || "").toLowerCase()) {
    case "property": return "🏠";
    case "reminder": return "🔔";
    case "project":  return "📁";
    default:         return "📋";
  }
}

function relDay(due, today) {
  if (!due) return null;
  if (due === today) return "Today";
  const d1 = new Date(today + "T12:00:00");
  const d2 = new Date(due  + "T12:00:00");
  const diff = Math.round((d2 - d1) / 86400000);
  if (diff === 1) return "Tomorrow";
  if (diff <= 6)  return `In ${diff} days`;
  return due.slice(5).replace("-", "/");
}

// Try to pull a time string out of task text e.g. "shift 9am" → "9 AM"
function extractTime(text) {
  const m = (text || "").match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = m[3].toUpperCase();
  return `${h}:${String(min).padStart(2, "0")} ${ampm}`;
}

function DayBriefing({ d, today }) {
  const jjLeft  = Math.max(0, (d.goals?.jj  || 3) - (d.jjCount  || 0));
  const gymLeft = Math.max(0, (d.goals?.gym || 2) - (d.gymCount || 0));

  // Items: today's tasks + next 3 upcoming
  const todayTasks    = (d.dueNow  || []).slice(0, 3);
  const upcomingTasks = (d.upcoming || []).slice(0, 3);
  const items = [...todayTasks, ...upcomingTasks].slice(0, 4);

  // Smart nudges
  const nudges = [];

  // Detect a shift task today to make gym nudge specific
  const shiftTask = todayTasks.find((t) =>
    /shift|work|job|office/i.test(t.task)
  );
  const shiftTime = shiftTask ? extractTime(shiftTask.task) : null;

  if (gymLeft > 0) {
    if (shiftTime) {
      nudges.push(`${gymLeft} gym session${gymLeft > 1 ? "s" : ""} left — good window before your ${shiftTime} shift.`);
    } else {
      nudges.push(`${gymLeft} gym session${gymLeft > 1 ? "s" : ""} left this week. Find a window today.`);
    }
  }
  if (jjLeft > 0) {
    nudges.push(`${jjLeft} Jiu Jitsu session${jjLeft > 1 ? "s" : ""} left to hit your weekly goal.`);
  }
  if (d.lastNight && Number(d.lastNight.hours) < 6) {
    nudges.push(`You slept ${d.lastNight.hours}h last night. Take it easy on intensity today.`);
  }
  if (gymLeft === 0 && jjLeft === 0) {
    nudges.push("Training goals done for the week. Rest and recover.");
  }

  if (items.length === 0 && nudges.length === 0) return null;

  return (
    <div className="day-brief-card">
      <p className="day-brief-title">Your week at a glance</p>

      {items.length > 0 && (
        <div className="day-brief-items">
          {items.map((t, i) => {
            const time = extractTime(t.task);
            const day  = relDay(t.due, today);
            return (
              <div key={t.id || i} className="day-brief-row">
                <span className="day-brief-icon">{typeIcon(t.type)}</span>
                <span className="day-brief-task">{t.task}</span>
                <span className="day-brief-when">
                  {time ? `${day} · ${time}` : day}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {nudges.length > 0 && (
        <div className="day-brief-nudges">
          {nudges.map((n, i) => (
            <p key={i} className="day-brief-nudge">
              <span className="day-brief-nudge-dot" />
              {n}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Morning brief card ───────────────────────────────────────

function MorningBrief() {
  const todayKey = `brief-${new Date().toLocaleDateString("en-CA")}`;
  const [brief, setBrief] = useState(() => {
    try { return localStorage.getItem(todayKey) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(!brief);

  useEffect(() => {
    if (brief) return;
    fetch("/api/brief")
      .then((r) => r.json())
      .then((data) => {
        if (data.brief) {
          setBrief(data.brief);
          try { localStorage.setItem(todayKey, data.brief); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loading && !brief) return null;

  return (
    <div className="brief-card">
      {loading ? (
        <div className="brief-skeleton">
          <span className="brief-shimmer" />
          <span className="brief-shimmer short" />
        </div>
      ) : (
        <>
          <span className="brief-icon">☀️</span>
          <p className="brief-text">{brief}</p>
        </>
      )}
    </div>
  );
}

export default function TodayTab({ d, today }) {
  const [foodOpen, setFoodOpen] = useState(false);
  const totalSessions = (d.jjCount || 0) + (d.gymCount || 0);
  const totalGoal = (d.goals?.jj || 3) + (d.goals?.gym || 2);
  const calPct = pct(d.nutrition?.calories || 0, d.targets?.calories || 2500);
  const proPct = pct(d.nutrition?.protein || 0, d.targets?.protein || 200);

  const sleepPoints = d.recentSleep
    ? d.recentSleep.slice(0, 7).reverse().map((s) => s.hours)
    : null;

  return (
    <div className="page-wrap">

      {/* ── Header ── */}
      <div className="page-header">
        <div className="hd-left">
          <div className="hd-greeting">{greeting()},<br/>Ebin</div>
          <div className="hd-date" style={{ marginTop: 6, fontSize: 13, fontWeight: 500, letterSpacing: 0, textTransform: "none", color: "var(--muted)" }}>{prettyDate(today)}</div>
        </div>
      </div>

      {/* ── Day briefing ── */}
      <DayBriefing d={d} today={today} />

      {/* ── Morning brief ── */}
      <MorningBrief />

      {/* ── Quick log bar ── */}
      <QuickLogBar todayWeight={d.todayWeight} todaySlept={d.todaySlept} today={today} />

      {/* ── Stats grid ── */}
      <p className="section-label">Today</p>
      <div className="stats-grid">

        {/* Calories — countdown */}
        <div className="sc green" style={{ cursor: "pointer" }} onClick={() => setFoodOpen((o) => !o)}>
          <div className="sc-label">Calories left</div>
          <div className="sc-num">
            {Math.max(0, (d.targets?.calories || 2500) - (d.nutrition?.calories || 0))}
            <span className="sc-denom">cal</span>
          </div>
          <div className="bar green">
            <span style={{ "--target": calPct + "%" }} />
          </div>
          <p className={"sc-sub" + (calPct >= 100 ? " hit" : "")}>
            {calPct >= 100 ? "Goal hit ✓" : `${d.nutrition?.calories || 0} eaten`}
          </p>
        </div>

        {/* Protein — countdown */}
        <div className="sc violet">
          <div className="sc-label">Protein left</div>
          <div className="sc-num">
            {Math.max(0, (d.targets?.protein || 200) - (d.nutrition?.protein || 0))}
            <span className="sc-denom">g</span>
          </div>
          <div className="bar">
            <span style={{ "--target": proPct + "%" }} />
          </div>
          <p className={"sc-sub" + (proPct >= 100 ? " hit" : "")}>
            {proPct >= 100 ? "Goal hit ✓" : `${d.nutrition?.protein || 0}g eaten`}
          </p>
        </div>

        {/* Training */}
        <div className="sc amber">
          <div className="sc-label">Training</div>
          <div className="sc-num">
            {totalSessions}
            <span className="sc-denom">/{totalGoal}</span>
          </div>
          <div className="training-dots">
            {Array.from({ length: totalGoal }).map((_, i) => (
              <span key={i} className={i < totalSessions ? "filled" : ""} />
            ))}
          </div>
          <p className="sc-sub">
            {d.jjCount || 0} JJ · {d.gymCount || 0} Gym
          </p>
        </div>

        {/* Sleep */}
        <div className="sc blue">
          <div className="sc-label">Sleep</div>
          <div className="sc-num">
            {d.lastNight ? d.lastNight.hours : "—"}
            <span className="sc-denom">h</span>
          </div>
          {sleepPoints && sleepPoints.length >= 2 ? (
            <Sparkline data={sleepPoints} />
          ) : (
            <div className="bar blue">
              <span style={{ "--target": d.lastNight ? Math.min(100, Math.round((d.lastNight.hours / 8) * 100)) + "%" : "0%" }} />
            </div>
          )}
          <p className="sc-sub">{d.streak > 0 ? `${d.streak}d streak` : "log tonight"}</p>
        </div>

      </div>

      {/* ── Food log (tap calories to expand) ── */}
      {foodOpen && (
        <div className="food-log-panel">
          <div className="flp-header">
            <span className="flp-title">Today&apos;s food</span>
            <button type="button" className="flp-close" onClick={() => setFoodOpen(false)}>×</button>
          </div>
          {d.nutrition?.entries?.length > 0 ? (
            <div className="flp-list">
              {d.nutrition.entries.map((e, i) => (
                <div key={e.id || i} className="flp-row">
                  <span className="flp-name">{e.raw_text || e.food_name || "Entry"}</span>
                  <span className="flp-macros">
                    {Math.round(e.calories || 0)} cal · {Math.round(e.protein_g || 0)}g pro
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="flp-empty">Nothing logged yet — tap Log to add a meal.</p>
          )}
        </div>
      )}

      {/* ── Checklist ── */}
      <LeaveChecklist />

      {/* ── Tasks due ── */}
      {d.dueNow && d.dueNow.length > 0 && (
        <>
          <p className="section-label">Due now</p>
          <div className="card">
            {d.dueNow.map((t) => (
              <div className="task" key={t.id}>
                <span className={"dot " + (t.due && t.due < today ? "red" : t.type === "Property" ? "amber" : "")} />
                <div className="body">
                  <p className="t">{t.task}</p>
                  <p className="meta">{t.type}{t.due ? ` · due ${shortDate(t.due)}` : ""}</p>
                </div>
                <form action={completeTask}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className="check-btn" type="submit" aria-label="Mark done">✓</button>
                </form>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── This week ── */}
      <p className="section-label">This week</p>
      <div className="stats-grid three-col" style={{ marginBottom: 12 }}>
        <div className="sc violet">
          <div className="sc-label">Jiu Jitsu</div>
          <div className="sc-num">{d.jjCount}<span className="sc-denom">/{d.goals?.jj || 3}</span></div>
          <div className="bar">
            <span style={{ "--target": pct(d.jjCount, d.goals?.jj || 3) + "%" }} />
          </div>
          <p className={"sc-sub" + (d.jjCount >= (d.goals?.jj || 3) ? " hit" : "")}>
            {d.jjCount >= (d.goals?.jj || 3) ? "Goal hit ✓" : `${(d.goals?.jj || 3) - d.jjCount} more`}
          </p>
        </div>
        <div className="sc green">
          <div className="sc-label">Gym</div>
          <div className="sc-num">{d.gymCount}<span className="sc-denom">/{d.goals?.gym || 2}</span></div>
          <div className="bar green">
            <span style={{ "--target": pct(d.gymCount, d.goals?.gym || 2) + "%" }} />
          </div>
          <p className={"sc-sub" + (d.gymCount >= (d.goals?.gym || 2) ? " hit" : "")}>
            {d.gymCount >= (d.goals?.gym || 2) ? "Goal hit ✓" : `${(d.goals?.gym || 2) - d.gymCount} more`}
          </p>
        </div>
        <div className="sc amber">
          <div className="sc-label">Property</div>
          <div className="sc-num">{d.focusHours || 0}<span className="sc-denom">h</span></div>
          <div className="bar amber">
            <span style={{ "--target": pct(d.focusHours || 0, 10) + "%" }} />
          </div>
          <p className={"sc-sub" + ((d.focusHours || 0) >= 10 ? " hit" : "")}>
            {(d.focusHours || 0) >= 10 ? "Goal hit ✓" : `${Math.max(0, 10 - (d.focusHours || 0))}h left`}
          </p>
        </div>
      </div>

      {/* ── Experiment ── */}
      <ExperimentCard experiment={d.experiment} />

      <div className="foot">
        <p style={{ fontSize: "12px", color: "var(--hint)" }}>Life OS · your day, in one place</p>
      </div>
    </div>
  );
}
