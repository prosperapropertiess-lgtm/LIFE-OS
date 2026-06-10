"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickForm({ kind, cta, fields, today, onSuccess }) {
  const router = useRouter();
  const makeDefaults = () =>
    Object.fromEntries(
      fields.map((f) => [f.name, f.default !== undefined ? f.default : f.type === "date" ? today : ""])
    );
  const [vals, setVals] = useState(makeDefaults);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null);

  const set = (name, v) => setVals((s) => ({ ...s, [name]: v }));

  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFlash(null);
    try {
      const r = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...vals }),
      });
      const d = await r.json();
      if (r.ok && d.ok) {
        setFlash({ ok: true, text: d.label });
        router.refresh();
        // Close modal after brief success flash
        setTimeout(() => onSuccess?.(), 1000);
      } else {
        setFlash({ ok: false, text: d.message || "Couldn't save — try again." });
        setTimeout(() => setFlash(null), 4000);
      }
    } catch {
      setFlash({ ok: false, text: "Couldn't save — try again." });
      setTimeout(() => setFlash(null), 4000);
    } finally {
      setSaving(false);
    }
  }

  if (flash?.ok) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0 16px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0 }}>Saved</p>
        {flash.text && (
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{flash.text}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="qf-fields">
        {fields.map((f) => (
          <div className={"qf-field" + (f.half ? " qf-half" : "")} key={f.name}>
            <label className="fld">{f.label}</label>
            {f.type === "select" ? (
              <select value={vals[f.name]} onChange={(e) => set(f.name, e.target.value)}>
                {f.options.map((o) => (
                  <option key={o} value={o}>{o === "" ? "—" : o}</option>
                ))}
              </select>
            ) : f.type === "date" ? (
              <input type="date" value={vals[f.name]} onChange={(e) => set(f.name, e.target.value)} />
            ) : f.type === "number" ? (
              <input type="text" inputMode="decimal" value={vals[f.name]} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder || ""} />
            ) : (
              <input type="text" value={vals[f.name]} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder || ""} />
            )}
          </div>
        ))}
      </div>
      {flash?.ok === false && (
        <p className="flash err">{flash.text}</p>
      )}
      <button className="primary" type="submit" disabled={saving}>
        {saving ? <span className="qa-spin" aria-hidden="true" /> : (cta || "Save")}
      </button>
    </form>
  );
}
