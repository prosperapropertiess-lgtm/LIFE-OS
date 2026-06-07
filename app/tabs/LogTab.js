"use client";

import QuickAdd from "../QuickAdd.js";
import QuickForm from "../QuickForm.js";
import FoodLogger from "../FoodLogger.js";

export default function LogTab({ today }) {
  return (
    <div>
      <div className="log-header">
        <h1>Log</h1>
        <p>Natural language or pick a form below</p>
      </div>

      <div style={{ padding: "0 16px" }}>
        <QuickAdd />

        <p className="section-label" style={{ marginTop: 20 }}>Training</p>
        <QuickForm
          kind="training"
          title="Log a session"
          cta="Save session"
          today={today}
          fields={[
            { name: "type", label: "Type", type: "select", options: ["Jiu Jitsu", "Gym"], half: true, default: "Jiu Jitsu" },
            { name: "date", label: "Date", type: "date", half: true, default: today },
            { name: "duration_min", label: "Minutes", type: "number", half: true, placeholder: "60" },
            { name: "energy", label: "Energy", type: "select", options: ["", "Low", "Medium", "High"], half: true, default: "" },
            { name: "moves_lifts", label: "Moves / weights", type: "text", placeholder: "Armbar from guard, bench 185x5" },
            { name: "notes", label: "Notes", type: "text", placeholder: "optional" },
          ]}
        />

        <p className="section-label">Sleep</p>
        <QuickForm
          kind="sleep"
          title="Log last night's sleep"
          cta="Save sleep"
          today={today}
          fields={[
            { name: "hours", label: "Hours", type: "number", half: true, placeholder: "7.5" },
            { name: "quality", label: "Quality", type: "select", options: ["Poor", "OK", "Good"], half: true, default: "Good" },
            { name: "date", label: "Date (morning you woke up)", type: "date", default: today },
          ]}
        />

        <p className="section-label">Body</p>
        <QuickForm
          kind="weight"
          title="Log weight"
          cta="Save weight"
          today={today}
          fields={[
            { name: "weight_kg", label: "Weight (kg)", type: "number", half: true, placeholder: "82.5" },
            { name: "date", label: "Date", type: "date", half: true, default: today },
          ]}
        />

        <p className="section-label">Food</p>
        <FoodLogger />

        <p className="section-label">Work</p>
        <QuickForm
          kind="focus"
          title="Log property focus hours"
          cta="Save hours"
          today={today}
          fields={[
            { name: "hours", label: "Hours", type: "number", half: true, placeholder: "2" },
            { name: "date", label: "Date", type: "date", half: true, default: today },
            { name: "notes", label: "What you worked on", type: "text", placeholder: "Marketplace ads, owner statements" },
          ]}
        />

        <p className="section-label">Tasks</p>
        <QuickForm
          kind="task"
          title="Add a task or reminder"
          cta="Add task"
          today={today}
          fields={[
            { name: "task", label: "Task", type: "text", placeholder: "Call the plumber" },
            { name: "type", label: "Type", type: "select", options: ["To-do", "Reminder", "Property", "Project"], half: true, default: "To-do" },
            { name: "due", label: "Due", type: "date", half: true, default: "" },
          ]}
        />

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
