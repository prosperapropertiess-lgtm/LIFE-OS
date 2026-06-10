"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const EMPTY = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

export default function FoodLogger({ onSuccess }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [stage, setStage] = useState("idle"); // idle | parsing | review | logging | done
  const [macros, setMacros] = useState(EMPTY);
  const [matched, setMatched] = useState(0);
  const [err, setErr] = useState("");
  const [logged, setLogged] = useState(null);

  useEffect(() => {
    if (stage !== "done") return;
    const t = setTimeout(() => onSuccess?.(), 1800);
    return () => clearTimeout(t);
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  async function check() {
    if (!text.trim()) return;
    setErr("");
    setStage("parsing");
    try {
      const r = await fetch("/api/parse-food?q=" + encodeURIComponent(text.trim()));
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error();
      setMacros({ calories: d.calories, protein_g: d.protein_g, carbs_g: d.carbs_g, fat_g: d.fat_g });
      setMatched(d.matched || 0);
      setStage("review");
    } catch {
      setErr("Couldn't read that one — enter the macros yourself below.");
      setMacros(EMPTY);
      setMatched(0);
      setStage("review");
    }
  }

  function upd(k, v) {
    setMacros((m) => ({ ...m, [k]: v }));
  }

  async function log() {
    setStage("logging");
    const date = new Date().toLocaleDateString("en-CA");
    try {
      const r = await fetch("/api/log-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: text.trim(), date, ...macros }),
      });
      if (!r.ok) throw new Error();
      setLogged({ ...macros, text: text.trim() });
      setStage("done");
      router.refresh();
    } catch {
      setErr("Couldn't save — try again.");
      setStage("review");
    }
  }

  function reset() {
    setText("");
    setMacros(EMPTY);
    setMatched(0);
    setErr("");
    setLogged(null);
    setStage("idle");
  }

  if (stage === "done" && logged) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0 16px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0 }}>Logged</p>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
          {logged.text} · {Math.round(logged.calories)} cal · {Math.round(logged.protein_g)}g protein
        </p>
      </div>
    );
  }

  if (stage === "review") {
    return (
      <div className="review">
        <p className="review-head">
          {text.trim()}
          {matched > 0 ? <span className="review-badge">{matched} item{matched > 1 ? "s" : ""} found</span> : null}
        </p>
        {err ? <p className="review-err">{err}</p> : null}
        <div className="macro-edit">
          <label>Calories<input type="text" inputMode="decimal" value={macros.calories} onChange={(e) => upd("calories", e.target.value)} /></label>
          <label>Protein (g)<input type="text" inputMode="decimal" value={macros.protein_g} onChange={(e) => upd("protein_g", e.target.value)} /></label>
          <label>Carbs (g)<input type="text" inputMode="decimal" value={macros.carbs_g} onChange={(e) => upd("carbs_g", e.target.value)} /></label>
          <label>Fat (g)<input type="text" inputMode="decimal" value={macros.fat_g} onChange={(e) => upd("fat_g", e.target.value)} /></label>
        </div>
        <p className="review-tip">Looks right? Log it. Know the exact numbers? Edit any field first.</p>
        <button type="button" className="primary" onClick={log} disabled={stage === "logging"}>
          {stage === "logging" ? "Saving…" : "Log it"}
        </button>
        <button type="button" className="ghost-btn" onClick={reset}>Start over</button>
      </div>
    );
  }

  return (
    <div>
      <label className="fld">What did you eat? (plain English)</label>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="chicken sandwich, 2 eggs, coffee with milk..."
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); check(); } }}
        autoFocus
      />
      <button type="button" className="primary" onClick={check} disabled={stage === "parsing" || !text.trim()}>
        {stage === "parsing" ? <span className="qa-spin" aria-hidden="true" /> : "Check macros"}
      </button>
    </div>
  );
}
