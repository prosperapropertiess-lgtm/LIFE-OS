"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickAdd() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [review, setReview] = useState(null); // { food, calories, protein_g, carbs_g, fat_g }
  const [done, setDone] = useState(null);

  async function submit() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setDone(null);
    setReview(null);
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
        router.refresh();
        setTimeout(() => setDone((c) => (c && c.id === d.id ? null : c)), 8000);
      }
    } catch (e) {
      setDone({ error: true });
      setTimeout(() => setDone(null), 3000);
    } finally {
      setBusy(false);
    }
  }

  function upd(k, v) {
    setReview((m) => ({ ...m, [k]: v }));
  }

  async function logFood() {
    if (!review || saving) return;
    setSaving(true);
    const date = new Date().toLocaleDateString("en-CA");
    try {
      const r = await fetch("/api/log-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: review.food, date,
          calories: review.calories, protein_g: review.protein_g, carbs_g: review.carbs_g, fat_g: review.fat_g,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error();
      const cal = Math.round(Number(review.calories) || 0);
      const pro = Math.round(Number(review.protein_g) || 0);
      setReview(null);
      setDone({ verb: "Logged", label: `${review.food} · ${cal} cal · ${pro}g protein`, kind: "food", id: d.id });
      router.refresh();
      setTimeout(() => setDone((c) => (c && c.id === d.id ? null : c)), 8000);
    } catch (e) {
      setDone({ error: true });
      setTimeout(() => setDone(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function undo() {
    if (!done || !done.id) return;
    const { kind, id } = done;
    setDone(null);
    try {
      await fetch("/api/delete-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id }),
      });
      router.refresh();
    } catch (e) {}
  }

  return (
    <div className="quickadd">
      <div className="quickadd-row">
        <input
          className="quickadd-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tell me anything — “ate a chicken sandwich”, “remind me to buy milk tomorrow”"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
        />
        <button className="quickadd-send" onClick={submit} disabled={busy || !text.trim()} aria-label="Add">
          {busy ? (
            <span className="qa-spin" aria-hidden="true" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {review ? (
        <div className="quickadd-review review">
          <p className="review-head">
            {review.food}
            {review.parse_error ? (
              <span className="review-badge err">Couldn&apos;t look up — enter numbers manually</span>
            ) : review.matched > 0 ? (
              <span className="review-badge">{review.matched} item{review.matched > 1 ? "s" : ""} found</span>
            ) : (
              <span className="review-badge warn">No match — check the numbers</span>
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
      ) : null}

      {done ? (
        done.error ? (
          <p className="quickadd-msg err">Couldn’t do that — try again.</p>
        ) : (
          <p className="quickadd-msg">
            <span className="qa-check">✓</span> <b>{done.verb}</b> · {done.label}
            <button className="qa-undo" onClick={undo}>Undo</button>
          </p>
        )
      ) : null}
    </div>
  );
}
