"use client";

import { useState, useEffect } from "react";
import TodayTab from "./tabs/TodayTab.js";
import LogTab from "./tabs/LogTab.js";
import PlanTab from "./tabs/PlanTab.js";
import ProgressTab from "./tabs/ProgressTab.js";

const TodayIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {active ? (
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" fill="currentColor"/>
    ) : (
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
    )}
  </svg>
);

const LogIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {active ? (
      <>
        <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" opacity="0.15"/>
        <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      </>
    ) : (
      <>
        <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </>
    )}
  </svg>
);

const PlanIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {active ? (
      <>
        <rect x="3" y="4" width="18" height="17" rx="3" fill="currentColor" opacity="0.15"/>
        <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </>
    ) : (
      <>
        <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </>
    )}
  </svg>
);

const ProgressIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {active ? (
      <>
        <rect x="2" y="14" width="4" height="8" rx="1.5" fill="currentColor" opacity="0.5"/>
        <rect x="10" y="9"  width="4" height="13" rx="1.5" fill="currentColor" opacity="0.75"/>
        <rect x="18" y="4"  width="4" height="18" rx="1.5" fill="currentColor"/>
        <path d="M3 8l5-4 6 5 5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </>
    ) : (
      <>
        <rect x="2"  y="14" width="4" height="8"  rx="1.5" stroke="currentColor" strokeWidth="1.7"/>
        <rect x="10" y="9"  width="4" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.7"/>
        <rect x="18" y="4"  width="4" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M3 8l5-4 6 5 5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </>
    )}
  </svg>
);

const TABS = [
  { label: "Today",    Icon: TodayIcon },
  { label: "Log",      Icon: LogIcon },
  { label: "Progress", Icon: ProgressIcon },
  { label: "Plan",     Icon: PlanIcon },
];

// ── Push notification prompt ─────────────────────────────────

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function PushPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !VAPID_PUBLIC_KEY) return;
    if (Notification.permission === "default") setShow(true);
  }, []);

  async function enable() {
    if (busy) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setShow(false); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setDone(true);
      setTimeout(() => setShow(false), 1500);
    } catch (e) {
      console.warn("Push subscribe failed:", e);
      setShow(false);
    } finally {
      setBusy(false);
    }
  }

  if (!show) return null;

  return (
    <div className="push-prompt">
      {done ? (
        <span className="push-done">Notifications enabled ✓</span>
      ) : (
        <>
          <span className="push-text">Get daily reminders?</span>
          <button className="push-btn" onClick={enable} disabled={busy}>
            {busy ? <span className="qa-spin sm" /> : "Enable"}
          </button>
          <button className="push-dismiss" onClick={() => setShow(false)}>✕</button>
        </>
      )}
    </div>
  );
}

export default function Shell({ d, today }) {
  const [tab, setTab] = useState(0);
  // Track which tabs have been visited — panels get "entered" class only on first visit
  const [visited, setVisited] = useState(new Set([0]));

  function goTab(i) {
    setTab(i);
    setVisited((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  }

  return (
    <div className="shell">
      <div className="tab-panels">
        <div className={`tab-panel${tab === 0 ? " active" : ""}${visited.has(0) ? " entered" : ""}`}>
          <TodayTab d={d} today={today} />
        </div>
        <div className={`tab-panel${tab === 1 ? " active" : ""}${visited.has(1) ? " entered" : ""}`}>
          <LogTab d={d} today={today} />
        </div>
        <div className={`tab-panel${tab === 2 ? " active" : ""}${visited.has(2) ? " entered" : ""}`}>
          <ProgressTab d={d} />
        </div>
        <div className={`tab-panel${tab === 3 ? " active" : ""}${visited.has(3) ? " entered" : ""}`}>
          <PlanTab d={d} today={today} />
        </div>
      </div>

      <PushPrompt />

      <nav className="tabbar" role="tablist" style={{ position: "fixed" }}>
        {/* sliding indicator */}
        <div
          className="tab-indicator"
          style={{ "--tab-index": tab }}
          aria-hidden="true"
        />

        {TABS.map(({ label, Icon }, i) => (
          <button
            key={label}
            className={`tab-btn${tab === i ? " active" : ""}`}
            onClick={() => goTab(i)}
            role="tab"
            aria-label={label}
            aria-selected={tab === i}
          >
            <span className="tb-icon"><Icon active={tab === i} /></span>
            <span className="tb-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
