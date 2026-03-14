import { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext.jsx";

const SCREENS = ["dashboard", "log", "suggestions", "progress"];

const NAV_ITEMS = [
  { id: "dashboard", icon: "⬡", label: "Home" },
  { id: "log", icon: "✦", label: "Log" },
  { id: "suggestions", icon: "◈", label: "Nudges" },
  { id: "progress", icon: "◎", label: "Progress" },
];

/*const COLORS = {
  bg: "#0F1A0F",
  card: "#162016",
  border: "#2A3D2A",
  accent: "#4EE878",
  yellow: "#F5C842",
  blue: "#5AB4CF",
  muted: "#6B8F6B",
  white: "#E8F5E8",
  red: "#E05555",
};*/
const COLORS = {
  bg: "#050705",      // Deep obsidian
  card: "#0D110D",    // Subtle elevation
  border: "#1A1F1A",  // Hairline border
  accent: "#BAFFD1",  // Minimalist Mint (soft & clean)
  yellow: "#E6D5A7",  // Desaturated gold
  blue: "#A7C7E6",    // Desaturated steel blue
  muted: "#5C665C",   // Low-contrast label text
  white: "#E8EEE8",   // Off-white for high readability
  red: "#CF9292",     // Soft rose (less aggressive)
};

// ── Reusable Components ──────────────────────────────────────────────────────

function TopBar({ title, subtitle }) {
  const { colors, theme, toggleTheme } = useTheme();

  return (
    <div style={{ padding: "20px 24px 12px", borderBottom: `1px solid ${colors.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: colors.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
            CarbonIQ
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.white, letterSpacing: -0.5 }}>
            {title}
          </div>
          {subtitle && <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: colors.card, border: `1px solid ${colors.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, cursor: "pointer"
          }}>🌿</div>
          <button
            onClick={toggleTheme}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: colors.card, border: `1px solid ${colors.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, cursor: "pointer",
              color: colors.muted
            }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, color, sub }) {
  const { colors } = useTheme();

  return (
    <div style={{
      background: colors.card, border: `1px solid ${colors.border}`,
      borderRadius: 12, padding: "16px 18px", flex: 1
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 11, color: colors.muted, marginTop: 2, lineHeight: 1.4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

function CategoryBar({ label, value, max, color, icon }) {
  const { colors } = useTheme();

  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ fontSize: 13, color: colors.white, fontWeight: 500 }}>{label}</span>
        </div>
        <span style={{ fontSize: 12, color, fontWeight: 700 }}>{value} kg</span>
      </div>
      <div style={{ height: 6, background: colors.border, borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function NudgeCard({ icon, title, saving, desc, tag }) {
  const { colors } = useTheme();
  const [done, setDone] = useState(false);

  return (
    <div style={{
      background: done ? "#1A2E1A" : colors.card,
      border: `1px solid ${done ? colors.accent : colors.border}`,
      borderRadius: 14, padding: "16px 18px", marginBottom: 12,
      transition: "all 0.3s ease"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 12, flex: 1 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: colors.border, display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0
          }}>{icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.white, marginBottom: 3 }}>{title}</div>
            <div style={{ fontSize: 11, color: colors.muted, lineHeight: 1.5 }}>{desc}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: colors.accent,
                background: "#1A3A1A", padding: "3px 8px", borderRadius: 999
              }}>Save {saving}</span>
              <span style={{
                fontSize: 10, color: colors.muted,
                background: colors.border, padding: "3px 8px", borderRadius: 999
              }}>{tag}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setDone(!done)}
          style={{
            width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${done ? colors.accent : colors.border}`,
            background: done ? colors.accent : "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, color: done ? colors.bg : colors.muted, flexShrink: 0,
            marginLeft: 10, transition: "all 0.2s"
          }}
        >{done ? "✓" : ""}</button>
      </div>
    </div>
  );
}

// ── Screens ──────────────────────────────────────────────────────────────────

function Dashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Current date for header (e.g. "Friday, Mar 14 · Delhi")
  const getCurrentDateString = () => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const dayNumber = now.getDate();

    return `${dayName}, ${monthName} ${dayNumber} · Delhi`;
  };

  useEffect(() => {
    async function fetchDashboard() {
      if (!user) {
        console.log("No user object found, skipping fetch Dashboard");
        setLoading(false);
        return;
      }
      try {
        console.log("Attempting to get Firebase ID token...");
        const token = await user.getIdToken();
        console.log("Token retrieved, fetching dashboard data for uid:", user.uid);
        const res = await fetch(`http://localhost:5000/api/dashboard/${user.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const json = await res.json();
        console.log("Dashboard data fetched successfully:", json);
        setData(json);
      } catch(err) {
        console.error("Failed to load dashboard:", err);
        // Set some safe default data so the UI doesn't crash if the backend is down
        setData({ error: err.message, logged_today: false, message: "Could not connect to server." });
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [user]);

  if (loading) {
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted }}>Loading dashboard...</div>;
  }

  // If the user hasn't logged anything today, the backend returns logged_today: false
  if (data && !data.logged_today) {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "0 0 80px" }}>
        <TopBar title="Good morning " subtitle="Current Streak: 🔥" />
        <div style={{ padding: "20px 24px", textAlign: "center", marginTop: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.white }}>Ready to log today?</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 8 }}>{data.message || "Head over to the log tab to record your daily footprint."}</div>
        </div>
      </div>
    );
  }

  // Live data handling 
  const today = data ? data.total_co2 : 0;
  const avg = data ? data.comparison.city_avg_kg : 12.9;
  const pct = data ? data.comparison.pct_vs_city_avg : 0;
  const drivingKm = data ? data.comparison.equivalent_driving_km : 0;
  const breakdown = data ? data.breakdown : { transport: 0, food: 0, energy: 0 };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 0 80px" }}>
      <TopBar title="Good morning " subtitle={getCurrentDateString()} />

      {/* Hero Score */}
      <div style={{ padding: "20px 24px" }}>
        <div style={{
          background: "linear-gradient(135deg, #162A16 0%, #1A3520 100%)",
          border: `1px solid ${COLORS.border}`, borderRadius: 18,
          padding: "24px", textAlign: "center", position: "relative", overflow: "hidden"
        }}>
          <div style={{
            position: "absolute", top: -30, right: -30, width: 120, height: 120,
            borderRadius: "50%", background: COLORS.accent, opacity: 0.06
          }} />
          <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            Today's Footprint
          </div>
          <div style={{ fontSize: 56, fontWeight: 900, color: COLORS.accent, letterSpacing: -2, lineHeight: 1 }}>
            {today}
          </div>
          <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 4 }}>kg CO₂</div>
          <div style={{
            marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6,
            background: "#1A3A1A", padding: "6px 14px", borderRadius: 999,
            fontSize: 12, color: COLORS.accent, fontWeight: 600
          }}>
            ↓ {pct}% below city average
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: COLORS.muted }}>
            = driving {drivingKm} km in a petrol car
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ padding: "0 24px", display: "flex", gap: 12, marginBottom: 20 }}>
        <StatCard value={`🔥 ${data ? data.streak : 0}`} label="Day streak" color={COLORS.yellow} />
        <StatCard value={`${data ? data.yearly_pace_tonnes : 0}T`} label="Yearly pace" color={COLORS.blue} sub="On track for target" />
      </div>

      {/* Breakdown */}
      <div style={{ padding: "0 24px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, marginBottom: 14, letterSpacing: 0.3 }}>
          Today's Breakdown
        </div>
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 14, padding: "18px 18px 8px"
        }}>
          <CategoryBar label="Transport" value={breakdown.transport} max={8} color={COLORS.accent} icon="🚗" />
          <CategoryBar label="Food" value={breakdown.food} max={8} color={COLORS.yellow} icon="🍽️" />
          <CategoryBar label="Energy" value={breakdown.energy} max={8} color={COLORS.blue} icon="⚡" />
        </div>
      </div>

      {/* Quick nudge */}
      <div style={{ padding: "20px 24px 0" }}>
        <div style={{
          background: "#1A2E1A", border: `1px solid ${COLORS.accent}`,
          borderRadius: 14, padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12
        }}>
          <div style={{ fontSize: 22 }}>💡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.accent }}>Today's Top Nudge</div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
              Switch lunch to vegetarian → save 1.4 kg CO₂
            </div>
          </div>
          <div style={{ fontSize: 18, color: COLORS.muted }}>›</div>
        </div>
      </div>
    </div>
  );
}

function LogActivity({ user }) {
  const [transport, setTransport] = useState("car");
  const [distance, setDistance] = useState(15);
  const [meal, setMeal] = useState("chicken");
  const [energy, setEnergy] = useState(8);
  const [logged, setLogged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [liveResult, setLiveResult] = useState(null);

  const calculateEmissions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('http://localhost:5000/api/log', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.uid,
          transport_mode: transport,
          distance_km: distance,
          meal_type: meal,
          energy_kwh: energy
        })
      });
      const data = await res.json();
      if (data.success) {
        setLiveResult(data.total_co2);
        setLogged(true);
      } else {
        alert("Error logging activity: " + (data.error || "Unknown"));
      }
    } catch(err) {
      console.error(err);
      alert("Failed to connect to backend");
    }
    setLoading(false);
  };

  const SelectField = ({ label, value, onChange, options }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map(([val, lbl]) => (
          <button key={val} onClick={() => onChange(val)} style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: `1.5px solid ${value === val ? COLORS.accent : COLORS.border}`,
            background: value === val ? "#1A3A1A" : COLORS.card,
            color: value === val ? COLORS.accent : COLORS.muted,
            cursor: "pointer", transition: "all 0.2s"
          }}>{lbl}</button>
        ))}
      </div>
    </div>
  );

  const SliderField = ({ label, value, onChange, min, max, unit, co2 }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 12, color: COLORS.white, fontWeight: 600 }}>{value} {unit} <span style={{ color: COLORS.accent }}>→ {co2} kg</span></div>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: COLORS.accent, height: 4 }} />
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 0 80px" }}>
      <TopBar title="Log Your Day" subtitle="Takes ~60 seconds" />

      <div style={{ padding: "20px 24px" }}>

        {/* Live total */}
        <div style={{
          background: "linear-gradient(135deg, #162A16, #1A3520)",
          border: `1px solid ${COLORS.border}`, borderRadius: 14,
          padding: "16px 20px", marginBottom: 24,
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 2, textTransform: "uppercase" }}>Estimated Total</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: COLORS.accent, letterSpacing: -1 }}>
              {liveResult || "?"} <span style={{ fontSize: 14, fontWeight: 400 }}>kg CO₂</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: COLORS.muted }}>connected to</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.white }}>Climatiq API</div>
          </div>
        </div>

        {/* Transport Section */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "18px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            🚗 Transport
          </div>
          <SelectField label="Mode" value={transport} onChange={setTransport}
            options={[["walk", "🚶 Walk"], ["bike", "🚲 Bike"], ["metro", "🚇 Metro"], ["car", "🚗 Car"], ["ev", "⚡ EV"], ["flight", "✈️ Flight"]]} />
          <SliderField label="Distance" value={distance} onChange={setDistance} min={1} max={100} unit="km" co2="?" />
        </div>

        {/* Food Section */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "18px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            🍽️ Today's Main Meal
          </div>
          <SelectField label="Meal type" value={meal} onChange={setMeal}
            options={[["vegan", "🌱 Vegan"], ["veg", "🥗 Veg"], ["fish", "🐟 Fish"], ["chicken", "🍗 Chicken"], ["beef", "🥩 Beef"]]} />
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: -8 }}>
            CO₂ impact: <span style={{ color: COLORS.accent, fontWeight: 600 }}>Calculated live 📡</span>
          </div>
        </div>

        {/* Energy Section */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "18px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, marginBottom: 14 }}>
            ⚡ Home Energy
          </div>
          <SliderField label="Usage today" value={energy} onChange={setEnergy} min={1} max={40} unit="kWh" co2="?" />
        </div>

        {/* Submit */}
        {!logged ? (
          <button onClick={calculateEmissions} disabled={loading} style={{
            width: "100%", padding: "16px", borderRadius: 14,
            background: COLORS.accent, border: "none", color: COLORS.bg,
            fontSize: 15, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3,
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? "Calculating Live..." : "Save Today's Log ✓"}
          </button>
        ) : (
          <div style={{
            width: "100%", padding: "16px", borderRadius: 14, textAlign: "center",
            background: "#1A3A1A", border: `1px solid ${COLORS.accent}`,
            fontSize: 14, fontWeight: 700, color: COLORS.accent
          }}>
            ✓ Saved! {liveResult} kg CO₂ logged to Firestore.
          </div>
        )}
      </div>
    </div>
  );
}

function Suggestions({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNudges() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`http://localhost:5000/api/nudges/${user.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const json = await res.json();
        setData(json);
      } catch(err) {
        console.error("Failed to load nudges:", err);
      }
      setLoading(false);
    }
    fetchNudges();
  }, [user]);

  if (loading) {
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted }}>Loading nudges...</div>;
  }

  if (data && data.error) {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "0 0 80px" }}>
        <TopBar title="Your Nudges" subtitle="Check back later" />
        <div style={{ padding: "20px 24px", textAlign: "center", marginTop: 40, color: COLORS.muted }}>
          {data.error}
        </div>
      </div>
    );
  }

  const nudges = data ? data.nudges : [];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 0 80px" }}>
      <TopBar title="Your Nudges" subtitle="3 personalised swaps for today" />
      <div style={{ padding: "20px 24px" }}>

        {/* Impact header */}
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 14, padding: "14px 18px", marginBottom: 20,
          display: "flex", gap: 16
        }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.accent }}>{data ? data.total_saveable : 0}</div>
            <div style={{ fontSize: 10, color: COLORS.muted }}>kg saveable today</div>
          </div>
          <div style={{ width: 1, background: COLORS.border }} />
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.yellow }}>{data ? data.monthly_saved : 0}</div>
            <div style={{ fontSize: 10, color: COLORS.muted }}>kg saved this month</div>
          </div>
          <div style={{ width: 1, background: COLORS.border }} />
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.blue }}>{(data ? data.yearly_pace_kg / 1000 : 0).toFixed(1)}T</div>
            <div style={{ fontSize: 10, color: COLORS.muted }}>yearly projection</div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 14, letterSpacing: 0.5 }}>
          Based on today's log — tap ✓ when done
        </div>

        {nudges.map((nudge, index) => (
          <NudgeCard
            key={index}
            icon={nudge.icon}
            title={nudge.title}
            saving={`${nudge.saving_kg} kg CO₂`}
            desc={nudge.description}
            tag={nudge.tag}
          />
        ))}

        {/* Info box */}
        <div style={{
          marginTop: 8, background: "#0F1A2A", border: `1px solid #2A3D5A`,
          borderRadius: 14, padding: "14px 16px"
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.blue, marginBottom: 4 }}>
            📊 Why these 3?
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.6 }}>
            CarbonIQ picks your top 3 highest-impact swaps from today's log — ranked by CO₂ saved, not effort required.
          </div>
        </div>
      </div>
    </div>
  );
}

function Progress({ user }) {
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`http://localhost:5000/api/history/${user.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const json = await res.json();
        setData(json);
      } catch(err) {
        console.error("Failed to load history:", err);
      }
      setLoading(false);
    }
    fetchHistory();
  }, [user]);

  if (loading) {
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted }}>Loading progress...</div>;
  }

  // Default values until active data populates
  let weekData = [0, 0, 0, 0, 0, 0, 0];
  let days = ["M", "T", "W", "T", "F", "S", "S"];
  let maxVal = 10;
  let breakdown = { transport: 0, food: 0, energy: 0 };
  let monthlyTotal = 0;
  
  if (data && data.weekly) {
    // API returns newest first due to reverse loop, we need oldest first for left-to-right chart
    const reversedWeekly = [...data.weekly].reverse();
    weekData = reversedWeekly.map(d => d.total_co2);
    days = reversedWeekly.map(d => d.day_label[0]); // Just first letter
    maxVal = Math.max(...weekData) || 10; // Avoid divide by 0
    breakdown = data.monthly.breakdown;
    monthlyTotal = data.monthly.total_co2;
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 0 80px" }}>
      <TopBar title="Your Progress" subtitle="Last 7 Days" />

      <div style={{ padding: "20px 24px" }}>

        {/* Weekly bar chart */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "18px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white }}>Weekly CO₂</div>
            <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600 }}>Active Log</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 90 }}>
            {weekData.map((val, i) => {
              const isToday = i === 6;
              const pct = (val / maxVal) * 100;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 9, color: isToday ? COLORS.accent : COLORS.muted, fontWeight: isToday ? 700 : 400 }}>
                    {val}
                  </div>
                  <div style={{
                    width: "100%", height: `${pct}%`, minHeight: 8,
                    borderRadius: "4px 4px 0 0",
                    background: isToday ? COLORS.accent : val > 7 ? COLORS.red + "99" : COLORS.border,
                    transition: "height 0.6s ease"
                  }} />
                  <div style={{ fontSize: 10, color: isToday ? COLORS.accent : COLORS.muted }}>{days[i]}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 16 }}>
            <div style={{ fontSize: 11, color: COLORS.muted }}>Avg: <span style={{ color: COLORS.white, fontWeight: 600 }}>{data ? data.monthly.avg_per_day : 0} kg</span></div>
            <div style={{ fontSize: 11, color: COLORS.muted }}>Total (30d): <span style={{ color: COLORS.white, fontWeight: 600 }}>{monthlyTotal} kg</span></div>
          </div>
        </div>

        {/* Monthly stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <StatCard value={monthlyTotal} label="kg CO₂ this month" color={COLORS.accent} sub="Track your footprint" />
          <StatCard value={`🗓️ ${data ? data.logs.length : 0}`} label="Logs this month" color={COLORS.blue} sub="Keep it up!" />
        </div>

        {/* Category breakdown */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "18px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, marginBottom: 14 }}>Monthly Breakdown</div>
          <CategoryBar label="Transport" value={breakdown.transport} max={monthlyTotal || 1} color={COLORS.accent} icon="🚗" />
          <CategoryBar label="Food" value={breakdown.food} max={monthlyTotal || 1} color={COLORS.yellow} icon="🍽️" />
          <CategoryBar label="Energy" value={breakdown.energy} max={monthlyTotal || 1} color={COLORS.blue} icon="⚡" />
        </div>

        {/* Achievements */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "18px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, marginBottom: 14 }}>Achievements</div>
          {[
            ["🌱", "First Log", "Completed your first daily log", true],
            ["🔥", "Week Warrior", "7 day logging streak", true],
            ["🚇", "Metro Month", "Used public transport 20 days", true],
            ["🥗", "Meat-Free Week", "7 days without red meat", false],
            ["⚡", "Energy Saver", "Under 5 kWh for 5 days", false],
          ].map(([icon, title, desc, unlocked]) => (
            <div key={title} style={{
              display: "flex", gap: 12, alignItems: "center", marginBottom: 12,
              opacity: unlocked ? 1 : 0.4
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: unlocked ? "#1A3A1A" : colors.border,
                border: `1px solid ${unlocked ? colors.accent : colors.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
              }}>{icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: unlocked ? colors.white : colors.muted }}>{title}</div>
                <div style={{ fontSize: 10, color: colors.muted }}>{desc}</div>
              </div>
              {unlocked && <div style={{ marginLeft: "auto", fontSize: 14, color: colors.accent }}>✓</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CarbonIQWireframe({ user }) {
  const { colors } = useTheme();
  const [active, setActive] = useState("dashboard");

  const screenMap = {
    dashboard: <Dashboard user={user} />,
    log: <LogActivity user={user} />,
    suggestions: <Suggestions user={user} />,
    progress: <Progress user={user} />,
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0A110A",
      display: "flex", alignItems: "center", justifyContent: "center",
      /*fontFamily: "'Georgia', serif", padding: "24px"*/
      fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Phone Frame */}
      <div style={{
        width: 375, height: 780,
        background: colors.bg, borderRadius: 44,
        border: `2px solid ${colors.border}`,
        boxShadow: `0 0 0 8px #0D150D, 0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(78,232,120,0.05)`,
        display: "flex", flexDirection: "column",
        overflow: "hidden", position: "relative"
      }}>
        {/* Status bar */}
        <div style={{
          height: 36, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 24px",
          fontSize: 11, color: colors.muted, flexShrink: 0
        }}>
          <span>{user?.email?.split('@')[0]}</span>
          <div style={{
            width: 80, height: 20, background: "#0A110A",
            border: `1px solid ${colors.border}`, borderRadius: 999,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors.border }} />
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ cursor: "pointer", padding: 2 }} onClick={async () => {
              const { getAuth, signOut } = await import("firebase/auth");
              signOut(getAuth());
            }}>Logout ⎋</span>
          </div>
        </div>

        {/* Screen Content */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {screenMap[active]}
        </div>

        {/* Bottom Nav */}
        <div style={{
          height: 68, background: colors.card,
          borderTop: `1px solid ${colors.border}`,
          display: "flex", alignItems: "center",
          padding: "0 8px 8px", flexShrink: 0
        }}>
          {NAV_ITEMS.map(({ id, icon, label }) => {
            const isActive = active === id;
            return (
              <button key={id} onClick={() => setActive(id)} style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 4,
                background: "transparent", border: "none", cursor: "pointer",
                padding: "8px 0", borderRadius: 12,
                transition: "all 0.2s"
              }}>
                <div style={{
                  width: 36, height: 28, borderRadius: 8,
                  background: isActive ? "#1A3A1A" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, color: isActive ? colors.accent : colors.muted,
                  transition: "all 0.2s"
                }}>{icon}</div>
                <span style={{
                  fontSize: 10, fontWeight: isActive ? 700 : 400,
                  color: isActive ? colors.accent : colors.muted,
                  transition: "color 0.2s"
                }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
