"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const EMPTY = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

export default function FoodLogger() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [stage, setStage] = useState("idle"); // idle | parsing | review | logging | done
  const [macros, setMacros] = useState(EMPTY);
  const [matched, setMatched] = useState(0);
  const [err, setErr] = useState("");
  const [logged, setLogged] = useState(null);

  // After a successful log, briefly show the confirmation, then clear for the next item.
  useEffect(() => {
    if (stage !== "done") return undefined;
    const t = setTimeout(() => reset(), 2600);
    return () => clearTimeout(t);
  }, [stage]);

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
    } catch (e) {
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
    } catch (e) {
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

  return (
    <details className="logger food">
      <summary>Log food <span className="chev">›</span></summary>
      <div className="form-body">
        {stage === "done" && logged ? (
          <div className="food-success">
            <div className="check">
              <svg viewBox="0 0 52 52" width="46" height="46" aria-hidden="true">
                <circle className="check-circle" cx="26" cy="26" r="24" fill="none" />
                <path className="check-mark" fill="none" d="M14 27l8 8 16-18" />
              </svg>
            </div>
            <p className="food-success-t">Logged</p>
            <p className="food-success-s">
              {logged.text} · {Math.round(logged.calories)} cal · {Math.round(logged.protein_g)}g protein
            </p>
            <button type="button" className="ghost-btn" onClick={reset}>Log another</button>
          </div>
        ) : stage === "review" ? (
          <div className="review">
            <p className="review-head">
              {text.trim()}
              {matched > 0 ? <span className="review-badge">{matched} item{matched > 1 ? "s" : ""} found</span> : null}
            </p>
            {err ? <p className="review-err">{err}</p> : null}
            <div className="macro-edit">
              <label>Calories
                <input type="text" inputMode="decimal" value={macros.calories} onChange={(e) => upd("calories", e.target.value)} />
              </label>
              <label>Protein (g)
                <input type="text" inputMode="decimal" value={macros.protein_g} onChange={(e) => upd("protein_g", e.target.value)} />
              </label>
              <label>Carbs (g)
                <input type="text" inputMode="decimal" value={macros.carbs_g} onChange={(e) => upd("carbs_g", e.target.value)} />
              </label>
              <label>Fat (g)
                <input type="text" inputMode="decimal" value={macros.fat_g} onChange={(e) => upd("fat_g", e.target.value)} />
              </label>
            </div>
            <p className="review-tip">Looks right? Log it. Know the exact numbers? Edit any field first.</p>
            <button type="button" className="primary" onClick={log} disabled={stage === "logging"}>
              {stage === "logging" ? "Saving…" : "Log it"}
            </button>
            <button type="button" className="ghost-btn" onClick={reset}>Start over</button>
          </div>
        ) : (
          <div>
            <label className="fld">What did you eat? (plain English)</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="chicken sandwich"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); check(); } }}
            />
            <button type="button" className="primary" onClick={check} disabled={stage === "parsing" || !text.trim()}>
              {stage === "parsing" ? "Reading the macros…" : "Check macros"}
            </button>
          </div>
        )}
      </div>
    </details>
  );
}
