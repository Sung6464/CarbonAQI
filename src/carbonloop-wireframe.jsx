import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bike,
  Bolt,
  Bus,
  Car,
  Flame,
  Footprints,
  Home,
  Leaf,
  Moon,
  Salad,
  Sparkles,
  SunMedium,
  Target,
  Train,
  TrendingDown,
  Trophy,
  Utensils,
  Wind,
} from "lucide-react";
import { useTheme } from "./ThemeContext.jsx";

const previewData = {
  dashboard: {
    total: 5.29,
    delta: 59,
    cityAverage: 12.9,
    driveEquivalent: 40.2,
    streak: 7,
    yearlyPace: 1.93,
    breakdown: [
      { label: "Transport", value: 3.15, color: "var(--color-accent)", icon: Car },
      { label: "Food", value: 1.5, color: "var(--color-accent-secondary)", icon: Utensils },
      { label: "Energy", value: 0.64, color: "var(--color-accent-soft)", icon: Bolt },
    ],
  },
  nudges: [
    {
      title: "Swap to a metro commute",
      description: "Your highest-impact move today. Replace the car trip and keep the streak multiplier alive.",
      saving: "1.8 kg",
      badge: "Epic Save",
      icon: Train,
    },
    {
      title: "Choose a vegetarian lunch",
      description: "A lighter meal keeps food emissions down and pushes your daily score into the green zone.",
      saving: "1.4 kg",
      badge: "Quick Win",
      icon: Salad,
    },
    {
      title: "Trim evening power usage",
      description: "Drop the home load for two hours to lock in a cleaner finish for the day.",
      saving: "0.5 kg",
      badge: "Combo Boost",
      icon: Bolt,
    },
  ],
  progress: [
    { day: "Mon", value: 6.4 },
    { day: "Tue", value: 5.8 },
    { day: "Wed", value: 4.9 },
    { day: "Thu", value: 5.1 },
    { day: "Fri", value: 4.3 },
    { day: "Sat", value: 5.0 },
    { day: "Sun", value: 3.9 },
  ],
};

const navItems = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "log", label: "Log", icon: Activity },
  { id: "nudges", label: "Nudges", icon: Sparkles },
  { id: "progress", label: "Progress", icon: Target },
];

const transportOptions = [
  { label: "Walk", icon: Footprints },
  { label: "Bike", icon: Bike },
  { label: "Metro", icon: Train },
  { label: "Bus", icon: Bus },
  { label: "Car", icon: Car, active: true },
];

const mealOptions = [
  { label: "Vegan", icon: Leaf },
  { label: "Veg", icon: Salad, active: true },
  { label: "Chicken", icon: Utensils },
];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function DemoShell({ children, active, setActive }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="preview-page">
      <div className="preview-backdrop" />
      <div className="preview-phone">
        <div className="preview-statusbar">
          <div className="preview-brand">
            <div className="preview-brand-mark">
              <Sparkles size={14} strokeWidth={1.8} />
            </div>
            <div>
              <div className="preview-brand-label">CarbonIQ</div>
              <div className="preview-brand-subtitle">Design System Preview</div>
            </div>
          </div>
          <button className="icon-button" onClick={toggleTheme} type="button" aria-label="Toggle theme">
            {theme === "dark" ? <SunMedium size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
          </button>
        </div>

        <div className="preview-content">{children}</div>

        <div className="preview-nav">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                className={cx("preview-nav-item", isActive && "is-active")}
                onClick={() => setActive(id)}
              >
                <span className="preview-nav-icon">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DemoHeader({ eyebrow, title, subtitle, aside }) {
  return (
    <div className="demo-header">
      <div>
        <div className="demo-eyebrow">{eyebrow}</div>
        <h1 className="demo-title">{title}</h1>
        <p className="demo-subtitle">{subtitle}</p>
      </div>
      {aside}
    </div>
  );
}

function MetricCard({ title, value, hint, accent = "primary", icon: Icon }) {
  return (
    <div className={cx("metric-card", `accent-${accent}`)}>
      <div className="metric-card-top">
        <span>{title}</span>
        {Icon ? <Icon size={16} strokeWidth={1.8} /> : null}
      </div>
      <div className="metric-card-value">{value}</div>
      <div className="metric-card-hint">{hint}</div>
    </div>
  );
}

function BreakdownRow({ label, value, color, icon: Icon }) {
  return (
    <div className="breakdown-row">
      <div className="breakdown-label">
        <span className="breakdown-icon">
          <Icon size={16} strokeWidth={1.8} />
        </span>
        <span>{label}</span>
      </div>
      <div className="breakdown-meta">
        <span>{value.toFixed(2)} kg</span>
        <div className="breakdown-bar">
          <div className="breakdown-bar-fill" style={{ width: `${Math.min((value / 4) * 100, 100)}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

function NudgeCard({ title, description, saving, badge, icon: Icon }) {
  return (
    <button type="button" className="nudge-card">
      <span className="nudge-icon">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <span className="nudge-content">
        <span className="nudge-title-row">
          <span className="nudge-title">{title}</span>
          <span className="nudge-badge">{badge}</span>
        </span>
        <span className="nudge-description">{description}</span>
        <span className="nudge-footer">
          <span className="nudge-saving">{saving} saved</span>
          <ArrowRight size={16} strokeWidth={1.8} />
        </span>
      </span>
    </button>
  );
}

function DashboardPreview() {
  return (
    <div className="demo-screen">
      <DemoHeader
        eyebrow="Daily Footprint"
        title="Good evening"
        subtitle="Massive numbers first. Support text drops back."
        aside={
          <div className="streak-chip">
            <span className="streak-chip-icon">
              <Flame size={14} strokeWidth={1.8} />
            </span>
            <span>7 Day Streak</span>
          </div>
        }
      />

      <section className="hero-card">
        <div className="hero-glow" />
        <div className="hero-label">Today's carbon load</div>
        <div className="hero-value">{previewData.dashboard.total}</div>
        <div className="hero-unit">kg CO2e</div>
        <div className="hero-pill">
          <TrendingDown size={16} strokeWidth={1.8} />
          <span>{previewData.dashboard.delta}% below city average</span>
        </div>
        <div className="hero-footnote">
          City average {previewData.dashboard.cityAverage} kg. Equivalent to driving {previewData.dashboard.driveEquivalent} km.
        </div>
      </section>

      <div className="metrics-grid">
        <MetricCard
          title="Day Streak"
          value={previewData.dashboard.streak}
          hint="Premium game reward styling"
          accent="primary"
          icon={Flame}
        />
        <MetricCard
          title="Yearly Pace"
          value={`${previewData.dashboard.yearlyPace}T`}
          hint="Secondary data in cyan"
          accent="secondary"
          icon={Wind}
        />
      </div>

      <section className="panel-card">
        <div className="panel-header">
          <div>
            <div className="panel-title">Breakdown</div>
            <div className="panel-subtitle">Consistent 18px corners and low-contrast border</div>
          </div>
        </div>
        <div className="breakdown-list">
          {previewData.dashboard.breakdown.map((item) => (
            <BreakdownRow key={item.label} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}

function LogPreview() {
  return (
    <div className="demo-screen">
      <DemoHeader
        eyebrow="Capture"
        title="Log your day"
        subtitle="Input surfaces use the same palette and spacing system."
      />

      <section className="hero-card compact">
        <div className="hero-label">Projected score</div>
        <div className="hero-value">4.86</div>
        <div className="hero-unit">kg CO2e</div>
      </section>

      <section className="panel-card">
        <div className="panel-title">Transport</div>
        <div className="selection-grid">
          {transportOptions.map(({ label, icon: Icon, active }) => (
            <button key={label} type="button" className={cx("selection-pill", active && "is-active")}>
              <Icon size={16} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-title">Meal</div>
        <div className="selection-grid">
          {mealOptions.map(({ label, icon: Icon, active }) => (
            <button key={label} type="button" className={cx("selection-pill", active && "is-active")}>
              <Icon size={16} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <button type="button" className="primary-cta">
        Save Today&apos;s Log
      </button>
    </div>
  );
}

function NudgesPreview() {
  return (
    <div className="demo-screen">
      <DemoHeader
        eyebrow="Recommendations"
        title="Your nudges"
        subtitle="Emoji-free premium cards with vector icons and game-like rewards."
        aside={
          <div className="reward-chip">
            <Trophy size={14} strokeWidth={1.8} />
            <span>3 Active Quests</span>
          </div>
        }
      />

      <div className="nudge-list">
        {previewData.nudges.map((nudge) => (
          <NudgeCard key={nudge.title} {...nudge} />
        ))}
      </div>
    </div>
  );
}

function ProgressPreview() {
  const maxValue = useMemo(() => Math.max(...previewData.progress.map((item) => item.value)), []);

  return (
    <div className="demo-screen">
      <DemoHeader
        eyebrow="History"
        title="Progress"
        subtitle="Secondary charts stay restrained while key values stay dominant."
      />

      <section className="panel-card">
        <div className="panel-header">
          <div>
            <div className="panel-title">Weekly trend</div>
            <div className="panel-subtitle">Electric cyan for supporting analytics</div>
          </div>
        </div>
        <div className="chart">
          {previewData.progress.map((item) => (
            <div key={item.day} className="chart-column">
              <div className="chart-value">{item.value}</div>
              <div className="chart-bar">
                <div
                  className="chart-bar-fill"
                  style={{ height: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
              <div className="chart-label">{item.day}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function CarbonLoopWireframePreview() {
  const [active, setActive] = useState("dashboard");

  const screens = {
    dashboard: <DashboardPreview />,
    log: <LogPreview />,
    nudges: <NudgesPreview />,
    progress: <ProgressPreview />,
  };

  return <DemoShell active={active} setActive={setActive}>{screens[active]}</DemoShell>;
}
