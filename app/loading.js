"use client";

import { useState, useEffect, useRef } from "react";

const STEPS = [
  "Pulling your training logs...",
  "Checking this week's nutrition...",
  "Loading sleep data...",
  "Crunching the numbers...",
  "Almost there...",
];

// Ease-out-expo — fast start, smooth deceleration
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

const DURATION = 2800; // ms to reach 88%
const TARGET   = 88;

export default function Loading() {
  const [progress, setProgress]   = useState(0);
  const [stepIdx,  setStepIdx]    = useState(0);
  const [stepKey,  setStepKey]    = useState(0); // triggers fade on each change
  const startRef = useRef(null);
  const rafRef   = useRef(null);

  useEffect(() => {
    // ── Smooth progress via RAF ──────────────────────────────
    startRef.current = performance.now();

    function tick(now) {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      setProgress(Math.round(easeOutExpo(t) * TARGET));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    // ── Cross-fade messages ──────────────────────────────────
    const msg = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
      setStepKey((k) => k + 1); // new key = remount = fade-in CSS fires again
    }, 900);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(msg);
    };
  }, []);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#f5f5f5",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      padding: "0 28px calc(64px + env(safe-area-inset-bottom, 0px)) 28px",
      maxWidth: 480,
      margin: "0 auto",
    }}>

      {/* ── Heading — lines stagger in ── */}
      <div style={{ marginBottom: 40 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "#c8c8c8", margin: "0 0 16px",
          fontFamily: "-apple-system, sans-serif",
          animation: "loFadeUp 0.5s cubic-bezier(0.22,0.7,0.18,1) 0.05s both",
        }}>
          Life OS
        </p>

        <h1 style={{
          fontFamily: "var(--font-hanken, -apple-system, sans-serif)",
          fontSize: "clamp(32px, 9vw, 40px)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
          margin: 0,
          color: "#0f0f0f",
        }}>
          <span style={{ display: "block", animation: "loFadeUp 0.55s cubic-bezier(0.22,0.7,0.18,1) 0.1s both" }}>
            Welcome back,
          </span>
          <span style={{ display: "block", animation: "loFadeUp 0.55s cubic-bezier(0.22,0.7,0.18,1) 0.2s both" }}>
            Ebin.
          </span>
          <span style={{ display: "block", color: "#c0c0c0", animation: "loFadeUp 0.55s cubic-bezier(0.22,0.7,0.18,1) 0.32s both" }}>
            Good things are
          </span>
          <span style={{ display: "block", color: "#c0c0c0", animation: "loFadeUp 0.55s cubic-bezier(0.22,0.7,0.18,1) 0.4s both" }}>
            being cooked.
          </span>
        </h1>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ animation: "loFadeUp 0.5s cubic-bezier(0.22,0.7,0.18,1) 0.45s both" }}>
        <div style={{
          height: 1.5,
          background: "rgba(0,0,0,0.07)",
          borderRadius: 99,
          overflow: "hidden",
          marginBottom: 14,
        }}>
          <div style={{
            height: "100%",
            background: "#000",
            borderRadius: 99,
            width: `${progress}%`,
            // Generous transition so RAF updates feel fluid, not ticky
            transition: "width 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }} />
        </div>

        {/* Message + percentage */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* key prop forces remount → CSS fade-in fires on every message change */}
          <p
            key={stepKey}
            style={{
              fontSize: 13, fontWeight: 500, color: "#888",
              fontFamily: "-apple-system, sans-serif",
              margin: 0,
              animation: "loFadeIn 0.35s ease both",
            }}
          >
            {STEPS[stepIdx]}
          </p>
          <p style={{
            fontSize: 13, fontWeight: 600, color: "#c8c8c8",
            fontFamily: "var(--font-hanken, -apple-system, sans-serif)",
            fontVariantNumeric: "tabular-nums",
            margin: 0, minWidth: "3ch", textAlign: "right",
          }}>
            {progress}%
          </p>
        </div>
      </div>

      <style>{`
        @keyframes loFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes loFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
