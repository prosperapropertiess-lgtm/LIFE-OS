"use client";

import { useState, useEffect } from "react";
import { addDays, shortDate, weekStart } from "../../lib/time.js";

// ── SVG helpers ──────────────────────────────────────────────

function makePath(vals, W, H, pad = 0.12) {
  if (!vals || vals.length < 2) return null;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const top = H * pad;
  const bot = H * (1 - pad);
  const pts = vals.map((v, i) => {
    const x = ((i / (vals.length - 1)) * W).toFixed(1);
    const y = (bot - ((v - min) / range) * (bot - top)).toFixed(1);
    return `${x},${y}`;
  });
  return `M${pts.join(" L")}`;
}

// ── Weight trend chart ───────────────────────────────────────

function WeightChart({ recent }) {
  const pts = (recent || []).slice(0, 7).slice().reverse();
  const vals = pts.map((p) => Number(p.weight_kg));
  const path = makePath(vals, 100, 44);
  if (!path) return <p className="prog-empty">No data yet — log your weight daily to see the trend.</p>;

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const fillPath = `${path} L100,44 L0,44 Z`;

  // Date labels: oldest (first) and newest (last) entry
  const oldestLabel = pts[0]?.date ? shortDate(pts[0].date) : "";
  const newestLabel = pts[pts.length - 1]?.date ? shortDate(pts[pts.length - 1].date) : "";

  return (
    <div className="prog-chart-area">
      <svg viewBox="0 0 100 44" preserveAspectRatio="none" style={{ width: "100%", height: "84%" }}>
        <defs>
          <linearGradient id="wGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#wGrad)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="prog-line-draw" />
        {vals.map((v, i) => {
          const x = (i / (vals.length - 1)) * 100;
          const range = max - min || 1;
          const y = 44 * 0.88 - ((v - min) / range) * (44 * 0.76);
          return (
            <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={i === vals.length - 1 ? "2.8" : "1.6"} fill="#0d9488" opacity={i === vals.length - 1 ? 1 : 0.4} />
          );
        })}
      </svg>
      {/* Axis labels */}
      <div className="prog-chart-axis">
        <span className="prog-axis-label">{oldestLabel}</span>
        <span className="prog-axis-label center">{min !== max ? `${min}–${max} kg` : `${min} kg`}</span>
        <span className="prog-axis-label">{newestLabel}</span>
      </div>
    </div>
  );
}

// ── Calorie bar chart ────────────────────────────────────────

function CalorieBars({ weekFood, wkStart, calorieTarget }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(wkStart, i));
  const vals = days.map((day) => {
    return (weekFood || [])
      .filter((f) => f.date === day)
      .reduce((s, f) => s + Number(f.calories || 0), 0);
  });
  const target = calorieTarget || 2500;
  const maxH = Math.max(...vals, target);

  return (
    <div className="prog-bars">
      {vals.map((cal, i) => {
        const pct = Math.min(100, Math.round((cal / target) * 100));
        const atGoal = cal >= target;
        return (
          <div key={i} className="prog-bar-col">
            <div className="prog-bar-track">
              <div
                className={`prog-bar-fill${atGoal ? " hit" : ""}`}
                style={{ height: `${pct}%`, animationDelay: `${i * 0.08}s` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Donut chart ──────────────────────────────────────────────

function Donut({ segments, size = 72 }) {
  // segments: [{ pct: 0-100, color: "#..." }]
  // Uses stroke-dasharray trick with r=15.9155 (circumference ≈ 100)
  let offset = 25; // start at top (12 o'clock = -90deg, but we rotate svg)
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
      {/* track */}
      <path
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none" stroke="var(--border)" strokeWidth="3.5"
      />
      {segments.map((seg, i) => {
        const dashOffset = 100 - offset;
        const el = (
          <path
            key={i}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={seg.color}
            strokeWidth="3.5"
            strokeDasharray={`${seg.pct}, 100`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="prog-donut-draw"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        );
        offset += seg.pct;
        return el;
      })}
    </svg>
  );
}

// ── Sleep sparkline ──────────────────────────────────────────

function SleepSparkline({ recentSleep }) {
  const vals = (recentSleep || []).slice(0, 7).reverse().map((s) => Number(s.hours) || 0);
  const path = makePath(vals, 100, 24);
  if (!path) return <p className="prog-empty">No data</p>;
  return (
    <div className="prog-sleep-chart">
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="prog-line-draw" />
      </svg>
    </div>
  );
}

// ── Training heatmap ─────────────────────────────────────────

function Heatmap({ weekTraining, wkStart }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(wkStart, i));
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const trainDays = new Set((weekTraining || []).map((t) => t.date));

  return (
    <div className="prog-heatmap">
      {days.map((day, i) => {
        const hasJJ = (weekTraining || []).some((t) => t.date === day && t.type === "Jiu Jitsu");
        const hasGym = (weekTraining || []).some((t) => t.date === day && t.type === "Gym");
        const active = trainDays.has(day);
        return (
          <div key={i} className="prog-heatmap-col">
            <div className={`prog-heatmap-cell${hasJJ ? " jj" : hasGym ? " gym" : active ? " active" : ""}`} title={shortDate(day)} />
            <span className="prog-heatmap-label">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Weight projection ─────────────────────────────────────────

function weightProjection(recent) {
  const pts = (recent || []).slice(0, 14).slice().reverse(); // oldest → newest
  if (pts.length < 4) return null;
  const n = pts.length;
  const xs = pts.map((_, i) => i);
  const ys = pts.map((p) => Number(p.weight_kg));
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0);
  const den = xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
  if (!den) return null;
  const slope = num / den; // kg per day
  if (Math.abs(slope) < 0.001) return null;
  const targetDays = 30;
  const projected = (yMean + slope * (n - 1 + targetDays)).toFixed(1);
  const direction = slope < 0 ? "↓" : "↑";
  const targetDate = addDays(pts[pts.length - 1].date, targetDays);
  return `${direction} ${projected} kg by ${shortDate(targetDate)}`;
}

// ── Correlation insights panel ────────────────────────────────

function InsightsPanel({ wkStart }) {
  const cacheKey = `insights-${wkStart}`;
  const [insights, setInsights] = useState(() => {
    try { return JSON.parse(localStorage.getItem(cacheKey) || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(!insights);

  useEffect(() => {
    if (insights) return;
    fetch("/api/insights")
      .then((r) => r.json())
      .then((data) => {
        if (data.insights?.length) {
          setInsights(data.insights);
          try { localStorage.setItem(cacheKey, JSON.stringify(data.insights)); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loading && !insights?.length) return null;

  return (
    <>
      <p className="section-label">Insights this week</p>
      {loading ? (
        <div className="insights-loading">
          {[0, 1, 2].map((i) => (
            <div key={i} className="insight-skeleton" style={{ animationDelay: `${i * 0.12}s` }}>
              <span className="brief-shimmer" />
              <span className="brief-shimmer short" />
            </div>
          ))}
        </div>
      ) : (
        <div className="insights-list">
          {insights.map((ins, i) => (
            <div key={i} className="insight-card">
              <span className="insight-icon">{ins.icon}</span>
              <div>
                <p className="insight-title">{ins.title}</p>
                <p className="insight-body">{ins.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Main component ───────────────────────────────────────────

export default function ProgressTab({ d }) {
  const wkStart = d.wkStart || weekStart(d.today);
  // Sleep avg
  const sleepVals = (d.recentSleep || []).slice(0, 7).map((s) => Number(s.hours) || 0).filter(Boolean);
  const sleepAvg = sleepVals.length ? (sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length).toFixed(1) : null;

  // Training minutes this week
  const totalMins = (d.weekTraining || []).reduce((s, t) => s + Number(t.duration_min || 0), 0);
  const minGoal = 300; // 5h weekly target
  const minPct = Math.min(100, Math.round((totalMins / minGoal) * 100));

  // Week range label
  const wkEnd = addDays(wkStart, 6);
  const weekLabel = `${shortDate(wkStart)} – ${shortDate(wkEnd)}`;

  const latest = d.weight?.latest;
  const delta = d.weight?.delta;
  const projection = weightProjection(d.weight?.recent);

  return (
    <div className="page-wrap">
      {/* ── Header ── */}
      <div className="page-header">
        <div className="hd-left">
          <div className="hd-date">{weekLabel}</div>
          <div className="hd-greeting">Weekly<br/>Progress</div>
        </div>
        <div className="avatar">E</div>
      </div>

      {/* ── Weight trend ── */}
      <div className="prog-card prog-card-full">
        <div className="prog-card-top">
          <div>
            <p className="prog-label">Weight Trend</p>
            <div className="prog-stat">
              {latest ? latest.weight_kg : "—"}
              <span className="prog-unit">kg</span>
            </div>
          </div>
          {delta != null ? (
            <div className={`prog-delta${delta <= 0 ? " down" : " up"}`}>
              <span>{delta > 0 ? "+" : ""}{delta} kg</span>
              <p>this week</p>
            </div>
          ) : !latest && (
            <div className="prog-empty-cta">Log weight daily<br/>to see your trend →</div>
          )}
        </div>
        <WeightChart recent={d.weight?.recent} />
        {projection && (
          <p className="weight-projection">At this rate: {projection}</p>
        )}
      </div>

      {/* ── 2-col grid ── */}
      <div className="prog-grid">

        {/* Avg Calories */}
        <div className="prog-card prog-card-sq">
          <p className="prog-label">Avg Calories</p>
          {d.weekFood && d.weekFood.length > 0 ? (
            <>
              <div className="prog-stat sm">
                {Math.round(d.weekFood.reduce((s, f) => s + Number(f.calories || 0), 0) / 7)}
                <span className="prog-unit">cal</span>
              </div>
              <CalorieBars weekFood={d.weekFood} wkStart={wkStart} calorieTarget={d.targets?.calories} />
            </>
          ) : (
            <div className="prog-card-empty">Log meals in the<br/>Log tab to track</div>
          )}
        </div>

        {/* Training time */}
        <div className="prog-card prog-card-sq">
          <p className="prog-label">Mat / Gym Time</p>
          <div className="prog-stat sm">
            {totalMins ? `${Math.floor(totalMins / 60)}h${totalMins % 60 ? ` ${totalMins % 60}m` : ""}` : "—"}
          </div>
          <div className="prog-donut-wrap">
            <Donut segments={[{ pct: minPct, color: "#ffffff" }]} />
            <div className="prog-donut-legend">
              <span style={{ color: "var(--hint)", fontSize: 10 }}>of 5h goal</span>
            </div>
          </div>
        </div>

        {/* Sleep */}
        <div className="prog-card prog-card-sq">
          <p className="prog-label">Avg Sleep</p>
          {sleepAvg ? (
            <>
              <div className="prog-stat sm">{sleepAvg}<span className="prog-unit">h</span></div>
              <SleepSparkline recentSleep={d.recentSleep} />
            </>
          ) : (
            <div className="prog-card-empty">Log sleep tonight<br/>to start tracking</div>
          )}
        </div>

        {/* Property focus */}
        <div className="prog-card prog-card-sq">
          <p className="prog-label">Property hrs</p>
          <div className="prog-stat sm">
            {d.focusHours || "—"}
            <span className="prog-unit">h</span>
          </div>
          <div className="prog-donut-wrap">
            <Donut segments={[{ pct: Math.min(100, Math.round(((d.focusHours || 0) / 10) * 100)), color: "#ffffff" }]} />
            <div className="prog-donut-legend">
              <span style={{ color: "var(--hint)", fontSize: 10 }}>of 10h goal</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Training heatmap ── */}
      <p className="section-label">Training this week</p>
      <div className="card" style={{ padding: "16px 20px" }}>
        <Heatmap weekTraining={d.weekTraining} wkStart={wkStart} />
      </div>

      {/* ── Correlation insights ── */}
      <InsightsPanel wkStart={wkStart} />

      <div className="foot">
        <p style={{ fontSize: "12px", color: "var(--hint)" }}>Life OS · weekly view</p>
      </div>
    </div>
  );
}
