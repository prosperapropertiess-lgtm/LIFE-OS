"use client";

import { useState, useEffect, useRef } from "react";
import QuickForm from "../QuickForm.js";
import FoodLogger from "../FoodLogger.js";

// ── Swipe-to-log (creatine / supplements) ────────────────────

const THUMB = 36; // thumb width px

function SwipeToLog({ id, emoji, name, today }) {
  const key = `habit-${id}-${today}`;
  const [done, setDone] = useState(false);
  const [thumbX, setThumbX] = useState(4); // px from left
  const dragging = useRef(false);
  const startX   = useRef(0);
  const startThumb = useRef(4);
  const trackRef = useRef(null);

  useEffect(() => {
    try { setDone(localStorage.getItem(key) === "1"); } catch {}
  }, [key]);

  function maxX() {
    return (trackRef.current?.offsetWidth || 260) - THUMB - 8; // 4px padding each side
  }

  function onPointerDown(e) {
    if (done) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    startX.current = e.clientX;
    startThumb.current = thumbX;
  }

  function onPointerMove(e) {
    if (!dragging.current || done) return;
    const dx = e.clientX - startX.current;
    const next = Math.max(4, Math.min(startThumb.current + dx, maxX()));
    setThumbX(next);
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    if (thumbX >= maxX() * 0.78) {
      setDone(true);
      setThumbX(4);
      try { localStorage.setItem(key, "1"); } catch {}
      if (navigator.vibrate) navigator.vibrate(40);
    } else {
      setThumbX(4); // snap back
    }
  }

  const pct = Math.min(1, (thumbX - 4) / Math.max(1, maxX() - 4));

  return (
    <div className={`swipe-log${done ? " done" : ""}`}>
      <span className="swipe-label">{emoji} {name}</span>
      {done ? (
        <span className="swipe-done-badge">✓ Done</span>
      ) : (
        <div
          className="swipe-track"
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="swipe-fill" style={{ width: `${pct * 100}%` }} />
          <div className="swipe-thumb" style={{ left: thumbX }}>›</div>
          {pct < 0.15 && <span className="swipe-hint">slide to log</span>}
        </div>
      )}
    </div>
  );
}

// ── Bottom sheet modal ───────────────────────────────────────

function Modal({ tile, today, onClose }) {
  // Lock scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-sheet">
        <div className="modal-drag" />
        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26 }}>{tile.emoji}</span>
            <span className="modal-title">{tile.name}</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          {tile.form(today, onClose)}
        </div>
      </div>
    </>
  );
}

// ── Tile definitions ─────────────────────────────────────────

const TILES = [
  {
    id: "training",
    emoji: "🥋",
    name: "Training",
    form: (today, onClose) => (
      <QuickForm
        kind="training"
        cta="Save session"
        today={today}
        onSuccess={onClose}
        fields={[
          { name: "type", label: "Type", type: "select", options: ["Jiu Jitsu", "Gym"], half: true, default: "Jiu Jitsu" },
          { name: "date", label: "Date", type: "date", half: true, default: today },
          { name: "duration_min", label: "Minutes", type: "number", half: true, placeholder: "60" },
          { name: "energy", label: "Energy", type: "select", options: ["", "Low", "Medium", "High"], half: true, default: "" },
          { name: "moves_lifts", label: "Moves / weights", type: "text", placeholder: "Armbar from guard, bench 185x5" },
          { name: "notes", label: "Notes", type: "text", placeholder: "optional" },
        ]}
      />
    ),
  },
  {
    id: "sleep",
    emoji: "😴",
    name: "Sleep",
    form: (today, onClose) => (
      <QuickForm
        kind="sleep"
        cta="Save sleep"
        today={today}
        onSuccess={onClose}
        fields={[
          { name: "hours", label: "Hours", type: "number", half: true, placeholder: "7.5" },
          { name: "quality", label: "Quality", type: "select", options: ["Poor", "OK", "Good"], half: true, default: "Good" },
          { name: "date", label: "Date (morning you woke up)", type: "date", default: today },
        ]}
      />
    ),
  },
  {
    id: "food",
    emoji: "🍽️",
    name: "Food",
    form: (today, onClose) => <FoodLogger onSuccess={onClose} />,
  },
  {
    id: "weight",
    emoji: "⚖️",
    name: "Weight",
    form: (today, onClose) => (
      <QuickForm
        kind="weight"
        cta="Save weight"
        today={today}
        onSuccess={onClose}
        fields={[
          { name: "weight_kg", label: "Weight (kg)", type: "number", half: true, placeholder: "82.5" },
          { name: "date", label: "Date", type: "date", half: true, default: today },
        ]}
      />
    ),
  },
  {
    id: "property",
    emoji: "🏠",
    name: "Property",
    form: (today, onClose) => (
      <QuickForm
        kind="focus"
        cta="Save hours"
        today={today}
        onSuccess={onClose}
        fields={[
          { name: "hours", label: "Hours", type: "number", half: true, placeholder: "2" },
          { name: "date", label: "Date", type: "date", half: true, default: today },
          { name: "notes", label: "What you worked on", type: "text", placeholder: "Marketplace ads, owner statements" },
        ]}
      />
    ),
  },
  {
    id: "task",
    emoji: "✅",
    name: "Task",
    form: (today, onClose) => (
      <QuickForm
        kind="task"
        cta="Add task"
        today={today}
        onSuccess={onClose}
        fields={[
          { name: "task", label: "Task", type: "text", placeholder: "Call the plumber" },
          { name: "type", label: "Type", type: "select", options: ["To-do", "Reminder", "Property", "Project"], half: true, default: "To-do" },
          { name: "due", label: "Due", type: "date", half: true, default: "" },
        ]}
      />
    ),
  },
];

// ── Hero input (unchanged) ───────────────────────────────────

function HeroInput() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(null);
  const [done, setDone] = useState(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true); setDone(null); setReview(null);
    try {
      const r = await fetch("/api/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error();
      if (d.intent === "food") {
        setReview({ food: d.food, matched: d.matched, parse_error: d.parse_error || null, calories: d.calories, protein_g: d.protein_g, carbs_g: d.carbs_g, fat_g: d.fat_g });
        setText("");
      } else {
        setText("");
        setDone({ verb: d.verb, label: d.label, kind: d.kind, id: d.id });
        setTimeout(() => setDone((c) => (c && c.id === d.id ? null : c)), 8000);
      }
    } catch {
      setDone({ error: true });
      setTimeout(() => setDone(null), 3000);
    } finally { setBusy(false); }
  }

  function upd(k, v) { setReview((m) => ({ ...m, [k]: v })); }

  async function logFood() {
    if (!review || saving) return;
    setSaving(true);
    const date = new Date().toLocaleDateString("en-CA");
    try {
      const r = await fetch("/api/log-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: review.food, date, calories: review.calories, protein_g: review.protein_g, carbs_g: review.carbs_g, fat_g: review.fat_g }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error();
      const cal = Math.round(Number(review.calories) || 0);
      const pro = Math.round(Number(review.protein_g) || 0);
      setReview(null);
      setDone({ verb: "Logged", label: `${review.food} · ${cal} cal · ${pro}g protein`, kind: "food", id: d.id });
      setTimeout(() => setDone((c) => (c && c.id === d.id ? null : c)), 8000);
    } catch {
      setDone({ error: true });
      setTimeout(() => setDone(null), 3000);
    } finally { setSaving(false); }
  }

  async function undo() {
    if (!done || !done.id) return;
    const { kind, id } = done;
    setDone(null);
    try {
      await fetch("/api/delete-entry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, id }) });
    } catch {}
  }

  return (
    <div>
      <div className="log-hero-card">
        <span className="log-hero-label">Quick Log</span>
        <textarea
          className="log-hero-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Tell me anything…\n\"ate a chicken wrap\", \"trained 90 min jiu jitsu\""}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          rows={3}
        />
        <div className="log-hero-actions">
          <button
            className="log-send-btn"
            onClick={submit}
            disabled={busy || !text.trim()}
            aria-label="Submit"
          >
            {busy ? (
              <span className="qa-spin" aria-hidden="true" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {review && (
        <div className="quickadd-review review" style={{ marginTop: 10 }}>
          <p className="review-head">
            {review.food}
            {review.matched > 0 ? (
              <span className="review-badge">{review.matched} item{review.matched > 1 ? "s" : ""} found</span>
            ) : (
              <span className="review-badge warn">No match — check numbers</span>
            )}
          </p>
          <div className="macro-edit">
            <label>Calories<input type="text" inputMode="decimal" value={review.calories} onChange={(e) => upd("calories", e.target.value)} /></label>
            <label>Protein (g)<input type="text" inputMode="decimal" value={review.protein_g} onChange={(e) => upd("protein_g", e.target.value)} /></label>
            <label>Carbs (g)<input type="text" inputMode="decimal" value={review.carbs_g} onChange={(e) => upd("carbs_g", e.target.value)} /></label>
            <label>Fat (g)<input type="text" inputMode="decimal" value={review.fat_g} onChange={(e) => upd("fat_g", e.target.value)} /></label>
          </div>
          <p className="review-tip">Looks right? Log it. Know the exact numbers? Edit any field first.</p>
          <button type="button" className="primary" onClick={logFood} disabled={saving}>
            {saving ? <span className="qa-spin" aria-hidden="true" /> : "Log it"}
          </button>
          <button type="button" className="ghost-btn" onClick={() => setReview(null)}>Cancel</button>
        </div>
      )}

      {done && (
        done.error ? (
          <p className="quickadd-msg err" style={{ padding: "0 2px" }}>Couldn&apos;t do that — try again.</p>
        ) : (
          <p className="quickadd-msg" style={{ padding: "0 2px" }}>
            <span className="qa-check">✓</span> <b>{done.verb}</b> · {done.label}
            <button className="qa-undo" onClick={undo}>Undo</button>
          </p>
        )
      )}
    </div>
  );
}

// ── Main tab ─────────────────────────────────────────────────

export default function LogTab({ today }) {
  const [active, setActive] = useState(null);

  const activeTile = TILES.find((t) => t.id === active);

  return (
    <div>
      <div className="log-hero" style={{ paddingBottom: 4 }}>
        <div style={{ paddingTop: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--hint)", marginBottom: 4 }}>
            Log
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, color: "var(--text)" }}>
            What happened?
          </p>
        </div>
        <HeroInput />
      </div>

      <div className="log-forms" style={{ paddingTop: 16 }}>
        <p className="section-label" style={{ marginTop: 0 }}>Structured entry</p>

        <div className="log-tile-grid">
          {TILES.map((tile) => (
            <button
              key={tile.id}
              className="log-tile"
              onClick={() => setActive(tile.id)}
              type="button"
              aria-label={tile.name}
            >
              <span className="log-tile-emoji">{tile.emoji}</span>
              <span className="log-tile-name">{tile.name}</span>
            </button>
          ))}
        </div>

        <div style={{ height: 16 }} />

        {/* Swipe-to-log habits */}
        <p className="section-label" style={{ marginTop: 0 }}>Daily habits</p>
        <SwipeToLog id="creatine" emoji="💊" name="Creatine" today={today} />
        <SwipeToLog id="supps"    emoji="🧴" name="Supplements" today={today} />

        <div style={{ height: 12 }} />
      </div>

      {/* Bottom sheet modal */}
      {activeTile && (
        <Modal
          key={activeTile.id}
          tile={activeTile}
          today={today}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}
