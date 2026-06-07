"use client";

import { useState } from "react";
import TodayTab from "./tabs/TodayTab.js";
import LogTab from "./tabs/LogTab.js";
import PlanTab from "./tabs/PlanTab.js";

const TodayIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    {active ? (
      <>
        <path d="M10 2L2 8v10h5v-5h6v5h5V8L10 2z" fill="currentColor"/>
      </>
    ) : (
      <path d="M10 2L2 8v10h5v-5h6v5h5V8L10 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill="none"/>
    )}
  </svg>
);

const LogIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    {active ? (
      <path fillRule="evenodd" clipRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" fill="currentColor"/>
    ) : (
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/>
    )}
  </svg>
);

const PlanIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    {active ? (
      <path fillRule="evenodd" clipRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v2H4V5zm0 4h3v2H4V9zm5 0h3v2H9V9zm5 0h2v2h-2V9zM4 13h3v2H4v-2zm5 0h3v2H9v-2z" fill="currentColor"/>
    ) : (
      <>
        <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M2 7h16M6 7v10M10 7v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </>
    )}
  </svg>
);

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

      <nav className="tabbar" role="tablist">
        <button
          className={`tab-btn${tab === 0 ? " active" : ""}`}
          onClick={() => setTab(0)}
          role="tab"
          aria-label="Today"
        >
          <span className="tb-icon"><TodayIcon active={tab === 0} /></span>
          <span className="tb-label">Today</span>
        </button>
        <button
          className={`tab-btn log-btn${tab === 1 ? " active" : ""}`}
          onClick={() => setTab(1)}
          role="tab"
          aria-label="Log"
        >
          <span className="tb-icon"><LogIcon active={tab === 1} /></span>
          <span className="tb-label">Log</span>
        </button>
        <button
          className={`tab-btn plan-btn${tab === 2 ? " active" : ""}`}
          onClick={() => setTab(2)}
          role="tab"
          aria-label="Plan"
        >
          <span className="tb-icon"><PlanIcon active={tab === 2} /></span>
          <span className="tb-label">Plan</span>
        </button>
      </nav>
    </div>
  );
}
