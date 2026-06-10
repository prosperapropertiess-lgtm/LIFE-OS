"use client";

import { useState } from "react";
import TodayTab from "./tabs/TodayTab.js";
import LogTab from "./tabs/LogTab.js";
import PlanTab from "./tabs/PlanTab.js";

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

const TABS = [
  { label: "Today",  Icon: TodayIcon },
  { label: "Log",    Icon: LogIcon },
  { label: "Plan",   Icon: PlanIcon },
];

export default function Shell({ d, today }) {
  const [tab, setTab] = useState(0);

  return (
    <div className="shell">
      <div className="tab-panels">
        <div className={`tab-panel${tab === 0 ? " active" : ""}`}>
          <TodayTab d={d} today={today} />
        </div>
        <div className={`tab-panel${tab === 1 ? " active" : ""}`}>
          <LogTab d={d} today={today} />
        </div>
        <div className={`tab-panel${tab === 2 ? " active" : ""}`}>
          <PlanTab d={d} today={today} />
        </div>
      </div>

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
            onClick={() => setTab(i)}
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
