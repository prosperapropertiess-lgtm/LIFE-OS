"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { greeting, prettyDate, shortDate } from "../../lib/time.js";
import { completeTask } from "../actions.js";

function pct(n, goal) {
  return Math.min(100, Math.round((n / goal) * 100));
}

function HabitPill({ label, logged, display, delta, onToggle }) {
  return (
    <div
      className={`habit-pill${logged ? " done" : ""}`}
      onClick={logged ? undefined : onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && !logged && onToggle?.()}
    >
      <div className="hp-text">
        <div className="hp-name">{label}</div>
        <div className="hp-sub">
          {logged ? (
            <>
              {display}
              {delta != null && (
                <span className={`hp-delta ${delta <= 0 ? "down" : "up"}`}>
                  {" "}{delta <= 0 ? "▼" : "▲"} {Math.abs(delta)}kg
                </span>
              )}
            </>
          ) : "tap to log"}
        </div>
      </div>
    </div>
  );
}

function CheckSvg() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
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
      <path d={d} fill="none" stroke="#0d9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function TodayTab({ d, today }) {
  const router = useRouter();

  const [sleepLogged, setSleepLogged] = useState(!!d.todaySlept);
  const [weightLogged, setWeightLogged] = useState(!!d.todayWeight);
  const [sleepDisplay, setSleepDisplay] = useState(
    d.todaySlept ? `${d.todaySlept.hours}h · ${d.todaySlept.quality || ""}`.replace(/·\s*$/, "") : null
  );
  const [weightDisplay, setWeightDisplay] = useState(
    d.todayWeight ? `${d.todayWeight.weight_kg} kg` : null
  );
  const [sleepOpen, setSleepOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState("Good");
  const [weightKg, setWeightKg] = useState("");
  const [sleepSaving, setSleepSaving] = useState(false);
  const [weightSaving, setWeightSaving] = useState(false);
  const [sleepErr, setSleepErr] = useState(null);
  const [weightErr, setWeightErr] = useState(null);

  async function saveSleep() {
    if (!sleepHours.trim() || sleepSaving) return;
    setSleepSaving(true); setSleepErr(null);
    try {
      const r = await fetch("/api/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "sleep", hours: sleepHours, quality: sleepQuality, date: today }) });
      const data = await r.json();
      if (r.ok && data.ok) {
        setSleepLogged(true); setSleepOpen(false);
        setSleepDisplay(`${sleepHours}h · ${sleepQuality}`);
        setSleepHours(""); router.refresh();
      } else { setSleepErr(data.message || "Couldn't save."); }
    } catch { setSleepErr("Try again."); }
    finally { setSleepSaving(false); }
  }

  async function saveWeight() {
    if (!weightKg.trim() || weightSaving) return;
    setWeightSaving(true); setWeightErr(null);
    try {
      const r = await fetch("/api/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "weight", weight_kg: weightKg, date: today }) });
      const data = await r.json();
      if (r.ok && data.ok) {
        setWeightLogged(true); setWeightOpen(false);
        setWeightDisplay(`${weightKg} kg`);
        setWeightKg(""); router.refresh();
      } else { setWeightErr(data.message || "Couldn't save."); }
    } catch { setWeightErr("Try again."); }
    finally { setWeightSaving(false); }
  }

  const totalSessions = (d.jjCount || 0) + (d.gymCount || 0);
  const totalGoal = (d.goals?.jj || 3) + (d.goals?.gym || 2);
  const calPct = pct(d.nutrition?.calories || 0, d.targets?.calories || 2500);
  const proPct = pct(d.nutrition?.protein || 0, d.targets?.protein || 200);

  // Build sparkline data from recent sleep logs if available
  const sleepPoints = d.recentSleep
    ? d.recentSleep.slice(0, 7).reverse().map((s) => s.hours)
    : null;

  return (
    <div className="page-wrap">

      {/* ── Header ── */}
      <div className="page-header">
        <div className="hd-left">
          <div className="hd-date">{prettyDate(today)}</div>
          <div className="hd-greeting">{greeting()},<br/>Ebin</div>
        </div>
        <div className="avatar">E</div>
      </div>

      {/* ── Habit pills ── */}
      <div className="habits-row">
        <HabitPill
          label="Sleep"
          logged={sleepLogged}
          display={sleepDisplay}
          onToggle={() => setSleepOpen((o) => !o)}
        />
        <HabitPill
          label="Weight"
          logged={weightLogged}
          display={weightDisplay}
          delta={d.weight?.delta}
          onToggle={() => setWeightOpen((o) => !o)}
        />
      </div>

      {sleepOpen && !sleepLogged && (
        <div className="habit-inline">
          <div className="hi-row">
            <input className="habit-input" type="text" inputMode="decimal" placeholder="hours slept" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveSleep()} autoFocus />
            <select className="habit-select" value={sleepQuality} onChange={(e) => setSleepQuality(e.target.value)}>
              <option>Poor</option><option>OK</option><option>Good</option>
            </select>
            <button type="button" className="habit-btn" onClick={saveSleep} disabled={!sleepHours.trim() || sleepSaving}>
              {sleepSaving ? <span className="qa-spin sm" /> : "Save"}
            </button>
          </div>
          {sleepErr && <p className="habit-err">{sleepErr}</p>}
        </div>
      )}

      {weightOpen && !weightLogged && (
        <div className="habit-inline">
          <div className="hi-row">
            <input className="habit-input" type="text" inputMode="decimal" placeholder="kg (e.g. 82.5)" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveWeight()} autoFocus />
            <button type="button" className="habit-btn" onClick={saveWeight} disabled={!weightKg.trim() || weightSaving}>
              {weightSaving ? <span className="qa-spin sm" /> : "Save"}
            </button>
          </div>
          {weightErr && <p className="habit-err">{weightErr}</p>}
        </div>
      )}

      {/* ── Stats grid ── */}
      <p className="section-label">Today</p>
      <div className="stats-grid">

        {/* Calories */}
        <div className="sc green">
          <div className="sc-label">Calories</div>
          <div className="sc-num">
            {d.nutrition?.calories || 0}
            <span className="sc-denom">/{d.targets?.calories || 2500}</span>
          </div>
          <div className="bar green">
            <span style={{ "--target": calPct + "%" }} />
          </div>
          <p className={"sc-sub" + (calPct >= 100 ? " hit" : "")}>
            {calPct >= 100 ? "Goal hit ✓" : `${(d.targets?.calories || 2500) - (d.nutrition?.calories || 0)} left`}
          </p>
        </div>

        {/* Protein */}
        <div className="sc violet">
          <div className="sc-label">Protein</div>
          <div className="sc-num">
            {d.nutrition?.protein || 0}
            <span className="sc-denom">g</span>
          </div>
          <div className="bar">
            <span style={{ "--target": proPct + "%" }} />
          </div>
          <p className={"sc-sub" + (proPct >= 100 ? " hit" : "")}>
            {proPct >= 100 ? "Goal hit ✓" : `goal ${d.targets?.protein || 200}g`}
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

      {/* ── Checklist ── */}
      <div className="card checklist">
        <h2>Before you leave</h2>
        <p>Keys · ID card · door access card · box cutter · lunch · a pen · lock the door</p>
      </div>

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

      {/* ── Property focus ── */}
      <p className="section-label">This week</p>
      <div className="stats-grid" style={{ marginBottom: 12 }}>
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
      </div>

      {/* ── Experiment ── */}
      {d.experiment && (
        <div className="card experiment">
          <h2>This week&apos;s experiment</h2>
          <p>{d.experiment}</p>
        </div>
      )}

      <div className="foot">
        <p style={{ fontSize: "12px", color: "var(--hint)" }}>Life OS · your day, in one place</p>
      </div>
    </div>
  );
}
