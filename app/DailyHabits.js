"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DailyHabits({ todaySlept, todayWeight, weightDelta }) {
  const router = useRouter();

  const [sleepLogged, setSleepLogged] = useState(!!todaySlept);
  const [weightLogged, setWeightLogged] = useState(!!todayWeight);

  const [sleepDisplay, setSleepDisplay] = useState(
    todaySlept
      ? `${todaySlept.hours}h${todaySlept.quality ? " · " + todaySlept.quality : ""}`
      : null
  );
  const [weightDisplay, setWeightDisplay] = useState(
    todayWeight ? `${todayWeight.weight_kg} kg` : null
  );

  const [sleepOpen, setSleepOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);

  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState("Good");
  const [weightKg, setWeightKg] = useState("");

  const [sleepSaving, setSleepSaving] = useState(false);
  const [weightSaving, setWeightSaving] = useState(false);
  const [sleepError, setSleepError] = useState(null);
  const [weightError, setWeightError] = useState(null);

  async function saveSleep() {
    if (!sleepHours.trim() || sleepSaving) return;
    setSleepSaving(true);
    setSleepError(null);
    const date = new Date().toLocaleDateString("en-CA");
    try {
      const r = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "sleep", hours: sleepHours, quality: sleepQuality, date }),
      });
      const d = await r.json();
      if (r.ok && d.ok) {
        setSleepLogged(true);
        setSleepOpen(false);
        setSleepDisplay(`${sleepHours}h · ${sleepQuality}`);
        setSleepHours("");
        router.refresh();
      } else {
        setSleepError(d.message || "Couldn't save.");
      }
    } catch (e) {
      setSleepError("Couldn't save — try again.");
    } finally {
      setSleepSaving(false);
    }
  }

  async function saveWeight() {
    if (!weightKg.trim() || weightSaving) return;
    setWeightSaving(true);
    setWeightError(null);
    const date = new Date().toLocaleDateString("en-CA");
    try {
      const r = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "weight", weight_kg: weightKg, date }),
      });
      const d = await r.json();
      if (r.ok && d.ok) {
        setWeightLogged(true);
        setWeightOpen(false);
        setWeightDisplay(`${weightKg} kg`);
        setWeightKg("");
        router.refresh();
      } else {
        setWeightError(d.message || "Couldn't save.");
      }
    } catch (e) {
      setWeightError("Couldn't save — try again.");
    } finally {
      setWeightSaving(false);
    }
  }

  const CheckIcon = () => (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M1.5 5.5L4 8 9.5 2.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="habits-card">
      {/* Sleep row */}
      <div
        className={"habit-row" + (sleepLogged ? " done" : " tappable")}
        onClick={() => !sleepLogged && setSleepOpen((o) => !o)}
      >
        <button
          type="button"
          className={"habit-check" + (sleepLogged ? " checked" : "")}
          aria-label={sleepLogged ? "Sleep logged" : "Log sleep"}
          tabIndex={-1}
        >
          {sleepLogged ? <CheckIcon /> : null}
        </button>
        <div className="habit-text">
          <span className="habit-name">Sleep</span>
          <span className="habit-sub">
            {sleepLogged ? sleepDisplay : "tap to log"}
          </span>
        </div>
        {!sleepLogged && (
          <span className="habit-caret">{sleepOpen ? "−" : "+"}</span>
        )}
      </div>

      {sleepOpen && !sleepLogged && (
        <>
          <div className="habit-form" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              inputMode="decimal"
              className="habit-input"
              placeholder="hours (e.g. 7.5)"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveSleep()}
              autoFocus
            />
            <select
              className="habit-select"
              value={sleepQuality}
              onChange={(e) => setSleepQuality(e.target.value)}
            >
              <option>Poor</option>
              <option>OK</option>
              <option>Good</option>
            </select>
            <button
              type="button"
              className="habit-btn"
              onClick={saveSleep}
              disabled={!sleepHours.trim() || sleepSaving}
            >
              {sleepSaving ? <span className="qa-spin sm" aria-hidden="true" /> : "Save"}
            </button>
          </div>
          {sleepError && <p className="habit-err">{sleepError}</p>}
        </>
      )}

      <div className="habit-divider" />

      {/* Weight row */}
      <div
        className={"habit-row" + (weightLogged ? " done" : " tappable")}
        onClick={() => !weightLogged && setWeightOpen((o) => !o)}
      >
        <button
          type="button"
          className={"habit-check" + (weightLogged ? " checked" : "")}
          aria-label={weightLogged ? "Weight logged" : "Log weight"}
          tabIndex={-1}
        >
          {weightLogged ? <CheckIcon /> : null}
        </button>
        <div className="habit-text">
          <span className="habit-name">Weight</span>
          <span className="habit-sub">
            {weightLogged ? (
              <>
                {weightDisplay}
                {weightDelta != null && (
                  <span className={"habit-delta " + (weightDelta <= 0 ? "down" : "up")}>
                    {weightDelta <= 0 ? " ▼" : " ▲"} {Math.abs(weightDelta)} kg
                  </span>
                )}
              </>
            ) : "tap to log"}
          </span>
        </div>
        {!weightLogged && (
          <span className="habit-caret">{weightOpen ? "−" : "+"}</span>
        )}
      </div>

      {weightOpen && !weightLogged && (
        <>
          <div className="habit-form" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              inputMode="decimal"
              className="habit-input"
              placeholder="kg (e.g. 82.5)"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveWeight()}
              autoFocus
            />
            <button
              type="button"
              className="habit-btn"
              onClick={saveWeight}
              disabled={!weightKg.trim() || weightSaving}
            >
              {weightSaving ? <span className="qa-spin sm" aria-hidden="true" /> : "Save"}
            </button>
          </div>
          {weightError && <p className="habit-err">{weightError}</p>}
        </>
      )}
    </div>
  );
}
