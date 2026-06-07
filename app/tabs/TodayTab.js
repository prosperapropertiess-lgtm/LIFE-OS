"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { greeting, prettyDate, shortDate } from "../../lib/time.js";
import { completeTask } from "../actions.js";

function pct(n, goal) {
  return Math.min(100, Math.round((n / goal) * 100));
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M1.5 5.5L4 8 9.5 2.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function HabitPill({ label, logged, display, delta, onToggle, open }) {
  return (
    <div
      className={`habit-pill${logged ? " done" : ""}`}
      onClick={logged ? undefined : onToggle}
    >
      <div className="hp-circle">{logged && <CheckIcon />}</div>
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
          ) : open ? "entering…" : "tap to log"}
        </div>
      </div>
    </div>
  );
}

export default function TodayTab({ d, today }) {
  const router = useRouter();

  const [sleepLogged, setSleepLogged] = useState(!!d.todaySlept);
  const [weightLogged, setWeightLogged] = useState(!!d.todayWeight);
  const [sleepDisplay, setSleepDisplay] = useState(
    d.todaySlept ? `${d.todaySlept.hours}h · ${d.todaySlept.quality || ""}`.trimEnd().replace(/·\s*$/, "") : null
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
    const date = new Date().toLocaleDateString("en-CA");
    try {
      const r = await fetch("/api/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "sleep", hours: sleepHours, quality: sleepQuality, date }) });
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
    const date = new Date().toLocaleDateString("en-CA");
    try {
      const r = await fetch("/api/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "weight", weight_kg: weightKg, date }) });
      const data = await r.json();
      if (r.ok && data.ok) {
        setWeightLogged(true); setWeightOpen(false);
        setWeightDisplay(`${weightKg} kg`);
        setWeightKg(""); router.refresh();
      } else { setWeightErr(data.message || "Couldn't save."); }
    } catch { setWeightErr("Try again."); }
    finally { setWeightSaving(false); }
  }

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-header">
        <div className="hd-left">
          <div className="hd-date">{prettyDate(today)}</div>
          <div className="hd-greeting">{greeting()}, Ebin</div>
        </div>
        <div className="avatar">E</div>
      </div>

      {/* Daily habits */}
      <div className="habits-row">
        <HabitPill
          label="Sleep"
          logged={sleepLogged}
          display={sleepDisplay}
          open={sleepOpen}
          onToggle={() => setSleepOpen((o) => !o)}
        />
        <HabitPill
          label="Weight"
          logged={weightLogged}
          display={weightDisplay}
          delta={d.weight.delta}
          open={weightOpen}
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

      {/* Pre-work checklist */}
      <div className="card checklist">
        <h2>Before you leave</h2>
        <p>Keys · ID card · door access card · box cutter · lunch · a pen · lock the door</p>
      </div>

      {/* Stats */}
      <p className="section-label">This week</p>
      <div className="stats-grid">
        <div className="sc violet">
          <div className="sc-label">Jiu Jitsu</div>
          <div className="sc-num">{d.jjCount}<span className="sc-denom"> / {d.goals.jj}</span></div>
          <div className="bar"><span style={{ "--target": pct(d.jjCount, d.goals.jj) + "%" }} /></div>
          <p className={"sc-sub" + (d.jjCount >= d.goals.jj ? " hit" : "")}>
            {d.jjCount >= d.goals.jj ? "Goal hit ✓" : `${d.goals.jj - d.jjCount} more to go`}
          </p>
        </div>
        <div className="sc green">
          <div className="sc-label">Gym</div>
          <div className="sc-num">{d.gymCount}<span className="sc-denom"> / {d.goals.gym}</span></div>
          <div className="bar green"><span style={{ "--target": pct(d.gymCount, d.goals.gym) + "%" }} /></div>
          <p className={"sc-sub" + (d.gymCount >= d.goals.gym ? " hit" : "")}>
            {d.gymCount >= d.goals.gym ? "Goal hit ✓" : `${d.goals.gym - d.gymCount} more to go`}
          </p>
        </div>
        <div className="sc amber">
          <div className="sc-label">Property focus</div>
          <div className="sc-num">{d.focusHours}<span className="sc-denom"> hrs</span></div>
          <p className="sc-sub">this week</p>
        </div>
        <div className="sc blue">
          <div className="sc-label">Sleep streak</div>
          <div className="sc-num">{d.streak}<span className="sc-denom"> {d.streak === 1 ? "day" : "days"}</span></div>
          <p className="sc-sub">{d.lastNight ? `last: ${d.lastNight.hours}h` : "log tonight"}</p>
        </div>
      </div>

      {/* Nutrition */}
      <div className="card">
        <h2>Today's nutrition</h2>
        <div className="nut-grid">
          <div className="nut-item">
            <div className="nut-row">
              <span>Protein</span>
              <b>{d.nutrition.protein}<span className="nut-of">g</span></b>
            </div>
            <div className="bar green"><span style={{ "--target": pct(d.nutrition.protein, d.targets.protein) + "%" }} /></div>
            <div className="nut-sub">goal {d.targets.protein} g</div>
          </div>
          <div className="nut-item">
            <div className="nut-row">
              <span>Calories</span>
              <b>{d.nutrition.calories}<span className="nut-of"> kcal</span></b>
            </div>
            <div className="bar amber"><span style={{ "--target": pct(d.nutrition.calories, d.targets.calories) + "%" }} /></div>
            <div className="nut-sub">goal {d.targets.calories}</div>
          </div>
        </div>
        <p className="nut-sub">Carbs {d.nutrition.carbs} g · Fat {d.nutrition.fat} g</p>
      </div>

      {/* Tasks due */}
      <div className="card">
        <h2>Due now</h2>
        {d.dueNow.length === 0 ? (
          <p className="empty">Nothing due — you're clear.</p>
        ) : (
          d.dueNow.map((t) => (
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
          ))
        )}
      </div>

      {/* Experiment */}
      {d.experiment && (
        <div className="card experiment">
          <h2>This week's experiment</h2>
          <p>{d.experiment}</p>
        </div>
      )}

      <div className="foot">
        <p style={{ fontSize: "12px", color: "var(--hint)" }}>Life OS · your day, in one place</p>
      </div>
    </div>
  );
}
