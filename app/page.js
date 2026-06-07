import { getDashboard } from "../lib/data.js";
import { greeting, prettyDate, shortDate, todayYMD } from "../lib/time.js";
import { completeTask } from "./actions.js";
import FoodLogger from "./FoodLogger.js";
import QuickAdd from "./QuickAdd.js";
import QuickForm from "./QuickForm.js";
import WeekPlanner from "./WeekPlanner.js";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function pct(n, goal) {
  return Math.min(100, Math.round((n / goal) * 100));
}

export default async function Dashboard() {
  const d = await getDashboard();
  const today = todayYMD();

  return (
    <div className="wrap">
      <div className="topbar">
        <div>
          <p className="date">{prettyDate(d.today)}</p>
          <p className="hi">{greeting()}, Ebin</p>
        </div>
        <div className="avatar">E</div>
      </div>

      <QuickAdd />

      {/* Pre-work checklist */}
      <div className="card checklist">
        <h2>Before you leave for work</h2>
        <p>Keys · ID card · door access card · box cutter · lunch · a pen · lock the door</p>
      </div>

      <WeekPlanner planner={d.planner} />

      {/* This week stats */}
      <div className="grid2">
        <div className="stat">
          <p className="label">Jiu jitsu</p>
          <p className="value">{d.jjCount}<span className="of"> / {d.goals.jj}</span></p>
          <div className="bar"><span style={{ "--target": pct(d.jjCount, d.goals.jj) + "%" }} /></div>
          <p className="sub sub-go">
            {d.jjCount >= d.goals.jj ? "goal hit" : `${d.goals.jj - d.jjCount} to go this week`}
          </p>
        </div>
        <div className="stat">
          <p className="label">Gym</p>
          <p className="value">{d.gymCount}<span className="of"> / {d.goals.gym}</span></p>
          <div className="bar green"><span style={{ "--target": pct(d.gymCount, d.goals.gym) + "%" }} /></div>
          <p className="sub sub-go">
            {d.gymCount >= d.goals.gym ? "goal hit" : `${d.goals.gym - d.gymCount} to go this week`}
          </p>
        </div>
        <div className="stat">
          <p className="label">Property hours</p>
          <p className="value">{d.focusHours}<span className="of"> hrs</span></p>
          <p className="sub sub-muted">this week</p>
        </div>
        <div className="stat">
          <p className="label">Sleep streak</p>
          <p className="value">{d.streak}<span className="of"> {d.streak === 1 ? "day" : "days"}</span></p>
          <p className="sub sub-muted">
            {d.lastNight ? `last night ${d.lastNight.hours}h` : "log tonight"}
          </p>
        </div>
      </div>

      {/* Today's nutrition */}
      <div className="card">
        <h2>Today's nutrition</h2>
        <div style={{ marginBottom: "12px" }}>
          <div className="macro-row">
            <span>Protein</span>
            <span><b>{d.nutrition.protein}</b> / {d.targets.protein} g</span>
          </div>
          <div className="bar green"><span style={{ "--target": pct(d.nutrition.protein, d.targets.protein) + "%" }} /></div>
        </div>
        <div>
          <div className="macro-row">
            <span>Calories</span>
            <span><b>{d.nutrition.calories}</b> / {d.targets.calories}</span>
          </div>
          <div className="bar"><span style={{ "--target": pct(d.nutrition.calories, d.targets.calories) + "%" }} /></div>
        </div>
        <p className="macro-sub">Carbs {d.nutrition.carbs} g · Fat {d.nutrition.fat} g</p>
      </div>

      {/* Weight */}
      <div className="stat" style={{ marginBottom: "12px" }}>
        <p className="label">Weight</p>
        <p className="value">
          {d.weight.latest ? d.weight.latest.weight_kg : "—"}
          <span className="of"> kg</span>
          {d.weight.delta != null ? (
            <span className={"trend " + (d.weight.delta <= 0 ? "down" : "up")}>
              {(d.weight.delta <= 0 ? "▼ " : "▲ ") + Math.abs(d.weight.delta) + " kg / 7d"}
            </span>
          ) : null}
        </p>
        <p className="sub sub-muted">
          {d.weight.latest ? "last logged " + shortDate(d.weight.latest.date) : "log your weight today"}
        </p>
      </div>

      {/* Tasks due */}
      <div className="card">
        <h2>Due now</h2>
        {d.dueNow.length === 0 ? (
          <p className="empty">Nothing due. You're clear.</p>
        ) : (
          d.dueNow.map((t) => (
            <div className="task" key={t.id}>
              <span className={"dot " + (t.due && t.due < today ? "red" : t.type === "Property" ? "amber" : "")} />
              <div className="body">
                <p className="t">{t.task}</p>
                <p className="meta">
                  {t.type}
                  {t.due ? ` · due ${shortDate(t.due)}` : ""}
                  {t.notes ? ` · ${t.notes}` : ""}
                </p>
              </div>
              <form action={completeTask}>
                <input type="hidden" name="id" value={t.id} />
                <button className="check-btn" type="submit" aria-label="Mark done">✓</button>
              </form>
            </div>
          ))
        )}
      </div>

      {/* This week's experiment */}
      {d.experiment ? (
        <div className="card experiment">
          <h2>This week's experiment</h2>
          <p>{d.experiment}</p>
        </div>
      ) : null}

      {/* Quick loggers */}
      <p className="section-title">Quick log</p>

      <QuickForm
        kind="training"
        title="Log a training session"
        cta="Save session"
        today={today}
        fields={[
          { name: "type", label: "Type", type: "select", options: ["Jiu Jitsu", "Gym"], half: true, default: "Jiu Jitsu" },
          { name: "date", label: "Date", type: "date", half: true, default: today },
          { name: "duration_min", label: "Minutes", type: "number", half: true, placeholder: "60" },
          { name: "energy", label: "Energy", type: "select", options: ["", "Low", "Medium", "High"], half: true, default: "" },
          { name: "moves_lifts", label: "Moves learned / weights pushed", type: "text", placeholder: "Armbar from guard, bench 185x5" },
          { name: "notes", label: "Notes", type: "text", placeholder: "optional" },
        ]}
      />

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

      <FoodLogger />

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

      {/* Recent training progress */}
      <p className="section-title">Recent training</p>
      <div className="card">
        {d.recentTraining.length === 0 ? (
          <p className="empty">No sessions logged yet.</p>
        ) : (
          d.recentTraining.map((r) => (
            <div className="log-line" key={r.id}>
              <span className="moves">
                <span className={"pill " + (r.type === "Gym" ? "gym" : "jj")}>{r.type === "Gym" ? "Gym" : "JJ"}</span>
                {"  "}{r.moves_lifts || r.notes || "—"}
              </span>
              <span className="when">{shortDate(r.date)}</span>
            </div>
          ))
        )}
      </div>

      {/* Upcoming */}
      {d.upcoming.length > 0 ? (
        <>
          <p className="section-title">Coming up</p>
          <div className="card">
            {d.upcoming.slice(0, 6).map((t) => (
              <div className="task" key={t.id}>
                <span className="dot" />
                <div className="body">
                  <p className="t">{t.task}</p>
                  <p className="meta">{t.type}{t.due ? ` · ${shortDate(t.due)}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className="foot">
        <p style={{ fontSize: "12px", color: "var(--hint)", margin: 0 }}>Life OS · your day, in one place</p>
      </div>
    </div>
  );
}
