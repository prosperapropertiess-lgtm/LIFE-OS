"use client";

import { useState, useEffect } from "react";

const STEPS = [
  "Pulling your training logs...",
  "Checking this week's nutrition...",
  "Loading sleep data...",
  "Crunching the numbers...",
  "Almost there...",
];

export default function Loading() {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    const t = setTimeout(() => setVisible(true), 60);

    // Fake progress: fast at first, then slows and holds below 90
    let p = 0;
    const tick = setInterval(() => {
      const speed = p < 35 ? 7 : p < 60 ? 4 : p < 78 ? 2 : 0.4;
      p = Math.min(p + speed + Math.random() * 3, 89);
      setProgress(Math.round(p));
    }, 140);

    // Rotate step messages
    const msg = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 800);

    return () => { clearTimeout(t); clearInterval(tick); clearInterval(msg); };
  }, []);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#f5f5f5",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      padding: "0 28px calc(72px + env(safe-area-inset-bottom, 0px)) 28px",
      maxWidth: 480,
      margin: "0 auto",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.4s ease",
    }}>

      {/* Heading */}
      <div style={{ marginBottom: 36 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "#b8b8b8", margin: "0 0 14px",
          fontFamily: "-apple-system, sans-serif",
        }}>
          Life OS
        </p>
        <h1 style={{
          fontFamily: "var(--font-hanken, -apple-system, sans-serif)",
          fontSize: "clamp(34px, 9vw, 42px)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.08,
          color: "#0f0f0f",
          margin: 0,
        }}>
          Welcome back,<br />
          Ebin.<br />
          <span style={{ color: "#b8b8b8" }}>Good things are<br />being cooked.</span>
        </h1>
      </div>

      {/* Progress bar + labels */}
      <div>
        {/* Bar */}
        <div style={{
          height: 2,
          background: "rgba(0,0,0,0.08)",
          borderRadius: 99,
          overflow: "hidden",
          marginBottom: 12,
        }}>
          <div style={{
            height: "100%",
            background: "#000",
            borderRadius: 99,
            width: `${progress}%`,
            transition: "width 0.16s ease-out",
          }} />
        </div>

        {/* Step + percentage */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <p style={{
            fontSize: 13, fontWeight: 500, color: "#737373",
            fontFamily: "-apple-system, sans-serif",
            margin: 0,
            transition: "opacity 0.3s",
            opacity: 0.9,
          }}>
            {STEPS[step]}
          </p>
          <p style={{
            fontSize: 13, fontWeight: 700, color: "#c0c0c0",
            fontFamily: "var(--font-hanken, -apple-system, sans-serif)",
            fontVariantNumeric: "tabular-nums",
            margin: 0,
            minWidth: "3ch",
            textAlign: "right",
          }}>
            {progress}%
          </p>
        </div>
      </div>

    </div>
  );
}
