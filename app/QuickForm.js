"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickForm({ kind, title, cta, fields, today }) {
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
        setVals(makeDefaults());
        setFlash({ ok: true, text: d.label, kind: d.kind, id: d.id });
        router.refresh();
        setTimeout(() => setFlash((c) => (c && c.id === d.id ? null : c)), 7000);
      } else {
        setFlash({ ok: false, text: d.message || "Couldn’t save — try again." });
        setTimeout(() => setFlash((c) => (c && !c.ok ? null : c)), 5000);
      }
    } catch (err) {
      setFlash({ ok: false, text: "Couldn’t save — try again." });
    } finally {
      setSaving(false);
    }
  }

  async function undo() {
    if (!flash || !flash.id) return;
    const { kind: k, id } = flash;
    setFlash(null);
    try {
      await fetch("/api/delete-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: k, id }),
      });
      router.refresh();
    } catch (e) {}
  }

  return (
    <details className="logger">
      <summary>{title} <span className="chev">›</span></summary>
      <div className="form-body">
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
          <button className="primary" type="submit" disabled={saving}>
            {saving ? <span className="qa-spin" aria-hidden="true" /> : (cta || "Save")}
          </button>
        </form>
        {flash ? (
          flash.ok ? (
            <p className="flash ok">
              <span className="qa-check">✓</span> {flash.text}
              {flash.id ? <button type="button" className="qa-undo" onClick={undo}>Undo</button> : null}
            </p>
          ) : (
            <p className="flash err">{flash.text}</p>
          )
        ) : null}
      </div>
    </details>
  );
}
