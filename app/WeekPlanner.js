"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WeekPlanner({ planner }) {
  const router = useRouter();
  const [shifts, setShifts] = useState(planner?.shifts || "");
  const [notes, setNotes] = useState(planner?.notes || "");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [feedback, setFeedback] = useState("");
  const [sendingFb, setSendingFb] = useState(false);
  const [fbMsg, setFbMsg] = useState("");

  const hasPlan = !!(planner && planner.rundown);

  async function save() {
    if (saving) return;
    if (!shifts.trim() && !notes.trim()) return;
    setSaving(true);
    setSavedMsg("");
    try {
      const r = await fetch("/api/planner/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shifts, notes }),
      });
      if (!r.ok) throw new Error();
      setSavedMsg("Saved. Claude will plan your week into Google Calendar and post the rundown right here.");
      router.refresh();
      setTimeout(() => setSavedMsg(""), 9000);
    } catch (e) {
      setSavedMsg("Couldn’t save — try again.");
    } finally {
      setSaving(false);
    }
  }

  async function sendFeedback() {
    if (sendingFb || !feedback.trim()) return;
    setSendingFb(true);
    setFbMsg("");
    try {
      const r = await fetch("/api/planner/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      if (!r.ok) throw new Error();
      setFeedback("");
      setFbMsg("Got it — I’ll work that into the next plan.");
      router.refresh();
      setTimeout(() => setFbMsg(""), 8000);
    } catch (e) {
      setFbMsg("Couldn’t send — try again.");
    } finally {
      setSendingFb(false);
    }
  }

  return (
    <div className="card planner">
      <h2>Week planner</h2>

      {hasPlan ? (
        <div className="planner-plan">
          <p className="planner-sub">Here's your week — already in your Google Calendar:</p>
          <div className="planner-rundown">{planner.rundown}</div>
          <label className="fld">Want changes? Tell me what to tweak.</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Move jiu jitsu to mornings this week; keep Sunday fully off…"
            style={{ minHeight: "64px" }}
          />
          <button type="button" className="primary" onClick={sendFeedback} disabled={sendingFb || !feedback.trim()}>
            {sendingFb ? <span className="qa-spin" aria-hidden="true" /> : "Send feedback"}
          </button>
          {fbMsg ? <p className="flash ok">{fbMsg}</p> : null}
        </div>
      ) : null}

      <details className="planner-edit" {...(!hasPlan ? { open: true } : {})}>
        <summary>{hasPlan ? "Update my schedule" : "Drop your schedule"}</summary>
        <div style={{ paddingTop: "6px" }}>
          <label className="fld">Your shifts this week</label>
          <textarea
            value={shifts}
            onChange={(e) => setShifts(e.target.value)}
            placeholder={"Mon 1:30–10pm\nWed 1:30–10pm\nFri 1:30–10pm\nThu & Sat off"}
            style={{ minHeight: "84px" }}
          />
          <label className="fld">Notes for the plan (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Hit jiu jitsu 5× this week; one full property day; protect a rest day."
            style={{ minHeight: "56px" }}
          />
          <button type="button" className="primary" onClick={save} disabled={saving || (!shifts.trim() && !notes.trim())}>
            {saving ? <span className="qa-spin" aria-hidden="true" /> : "Save schedule"}
          </button>
          {savedMsg ? <p className="flash ok">{savedMsg}</p> : null}
        </div>
      </details>
    </div>
  );
}
