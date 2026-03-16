import { useEffect, useState } from "react";
import { useTheme } from "./ThemeContext.jsx";
import { api } from "./api";

const COLORS = {
  bg: "#050705",
  card: "#0D110D",
  border: "#1A1F1A",
  accent: "#BAFFD1",
  yellow: "#E6D5A7",
  blue: "#A7C7E6",
  muted: "#6B8F6B",
  white: "#E8F5E8",
  red: "#E05555",
};

function TopBar({ title, subtitle }) {
  const onBack = null;

  return (
    <div
      style={{
        padding: "16px 24px",
        borderBottom: `1px solid ${COLORS.border}`,
        background: COLORS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <div>
        <h1 style={{ color: COLORS.white, margin: 0, fontSize: 20 }}>{title}</h1>
        <p style={{ color: COLORS.muted, margin: "4px 0 0 0", fontSize: 14 }}>{subtitle}</p>
      </div>
      {onBack ? (
        <button
          onClick={onBack}
          style={{
            padding: "8px 12px",
            borderRadius: 12,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.card,
            color: COLORS.accent,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          ← Personal
        </button>
      ) : null}
    </div>
  );
}

function MetricCard({ title, value, subtitle, color = COLORS.accent }) {
  return (
    <div
      style={{
        background: COLORS.card,
        borderRadius: 12,
        padding: 16,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 24, color, fontWeight: 800, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: COLORS.muted }}>{subtitle}</div>
    </div>
  );
}

function EmployeeCard({ employee, rank }) {
  return (
    <div
      style={{
        background: COLORS.card,
        borderRadius: 12,
        padding: 16,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ color: COLORS.white, fontSize: 15, fontWeight: 700 }}>{employee.name}</div>
          <div style={{ color: COLORS.muted, fontSize: 12 }}>{employee.role === "admin" ? "Admin" : "Employee"}</div>
        </div>
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: rank <= 3 ? "#1A3A1A" : COLORS.bg,
            border: `1px solid ${rank <= 3 ? COLORS.accent : COLORS.border}`,
            color: rank <= 3 ? COLORS.accent : COLORS.muted,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          #{rank}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <MiniStat label="Today" value={employee.logged_today ? `${employee.today_co2}kg` : "No log"} color={employee.logged_today ? COLORS.accent : COLORS.muted} />
        <MiniStat label="Month" value={`${employee.monthly_co2}kg`} color={COLORS.blue} />
        <MiniStat label="Streak" value={`${employee.streak}d`} color={COLORS.yellow} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div
      style={{
        background: COLORS.bg,
        borderRadius: 10,
        padding: 10,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div style={{ color: COLORS.muted, fontSize: 10, marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontSize: 14, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function LogRow({ log }) {
  const breakdown = log.breakdown || {};
  return (
    <div
      style={{
        background: COLORS.card,
        borderRadius: 12,
        padding: 14,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <div style={{ color: COLORS.white, fontSize: 14, fontWeight: 700 }}>{log.name}</div>
          <div style={{ color: COLORS.muted, fontSize: 11 }}>{log.role === "admin" ? "Admin" : "Employee"} • {log.date}</div>
        </div>
        <div style={{ color: COLORS.accent, fontSize: 16, fontWeight: 800 }}>{log.total_co2} kg</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <BreakdownPill label="Transport" value={breakdown.transport || 0} />
        <BreakdownPill label="Food" value={breakdown.food || 0} />
        <BreakdownPill label="Energy" value={breakdown.energy || 0} />
      </div>
    </div>
  );
}

function BreakdownPill({ label, value }) {
  return (
    <div
      style={{
        padding: "4px 8px",
        borderRadius: 999,
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        color: COLORS.muted,
        fontSize: 11,
      }}
    >
      {label}: <span style={{ color: COLORS.white }}>{value}kg</span>
    </div>
  );
}

function CreateCompanyForm({ onSuccess }) {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!companyName.trim()) return;

    setLoading(true);
    try {
      await api.createCompany({ name: companyName.trim() });
      onSuccess();
    } catch (err) {
      alert("Failed to create company: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: COLORS.card, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <div style={{ color: COLORS.white, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Create your company workspace</div>
      <div style={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
        Your company signup is active. Create the workspace here, then share the generated company ID with employees from the dashboard.
      </div>
      <input
        type="text"
        placeholder="Company name"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          color: COLORS.white,
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      />
      <button
        onClick={handleCreate}
        disabled={loading || !companyName.trim()}
        style={{
          width: "100%",
          padding: 12,
          background: COLORS.accent,
          color: COLORS.bg,
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Creating..." : "Create Company"}
      </button>
    </div>
  );
}

function JoinCompanyForm({ onSuccess }) {
  const [companyId, setCompanyId] = useState("");
  const [companyInfo, setCompanyInfo] = useState(null);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateCompanyId = async () => {
    if (!companyId.trim()) return;

    setValidating(true);
    try {
      const info = await api.getCompanyInfo(companyId.trim());
      setCompanyInfo(info);
    } catch (err) {
      setCompanyInfo(null);
      alert("Company not found: " + err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleJoin = async () => {
    if (!companyInfo) return;

    setLoading(true);
    try {
      await api.joinCompany({ company_id: companyId.trim() });
      onSuccess();
    } catch (err) {
      alert("Failed to join company: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: COLORS.card, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <div style={{ color: COLORS.white, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Join a company</div>
      <div style={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
        Individual accounts can only join an existing company. Enter the company ID shared by your admin.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Enter company ID"
          value={companyId}
          onChange={(e) => {
            setCompanyId(e.target.value);
            setCompanyInfo(null);
          }}
          style={{
            flex: 1,
            padding: 12,
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            color: COLORS.white,
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={validateCompanyId}
          disabled={validating || !companyId.trim()}
          style={{
            padding: "12px 14px",
            borderRadius: 8,
            border: "none",
            background: COLORS.yellow,
            color: COLORS.bg,
            cursor: validating ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          {validating ? "..." : "Check"}
        </button>
      </div>

      {companyInfo ? (
        <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.blue}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <div style={{ color: COLORS.white, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{companyInfo.name}</div>
          <div style={{ color: COLORS.muted, fontSize: 12 }}>{companyInfo.employee_count} employees in workspace</div>
        </div>
      ) : null}

      <button
        onClick={handleJoin}
        disabled={loading || !companyInfo}
        style={{
          width: "100%",
          padding: 12,
          background: companyInfo ? COLORS.blue : COLORS.muted,
          color: COLORS.white,
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          cursor: loading || !companyInfo ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Joining..." : "Join Company"}
      </button>
    </div>
  );
}

export default function CompanyDashboard({ user, activeTab = "overview", onExit }) {
  const { colors } = useTheme();
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      setLoading(true);
      try {
        const userInfo = await api.getDashboard(user.uid);
        setUserData(userInfo);

        if (!userInfo.company_id) {
          setCompanyData(null);
          setCompanyInfo(null);
          return;
        }

        if (userInfo.role === "admin") {
          const adminData = await api.getCompanyDashboard(userInfo.company_id);
          setCompanyData(adminData);
          setCompanyInfo(null);
        } else {
          const info = await api.getCompanyInfo(userInfo.company_id);
          setCompanyInfo(info);
          setCompanyData(null);
        }
      } catch (err) {
        console.error("Failed to load company dashboard:", err);
        setCompanyData({ error: err.message });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, refreshKey]);

  const refresh = () => setRefreshKey((value) => value + 1);

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted }}>
        Loading company workspace...
      </div>
    );
  }

  if (companyData?.error) {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "0 0 80px" }}>
        <TopBar title="Company" subtitle="Workspace unavailable" onBack={onExit} />
        <div style={{ padding: "20px 24px", color: COLORS.red }}>{companyData.error}</div>
      </div>
    );
  }

  if (!userData?.company_id) {
    const isCompanyAccount = userData?.account_type === "company";

    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "0 0 80px" }}>
        <TopBar
          title="Company"
          subtitle={isCompanyAccount ? "Create and manage your company workspace" : "Join an existing company with an ID"}
          onBack={onExit}
        />
        <div style={{ padding: "20px 24px" }}>
          {isCompanyAccount ? <CreateCompanyForm onSuccess={refresh} /> : <JoinCompanyForm onSuccess={refresh} />}
        </div>
      </div>
    );
  }

  if (userData.role === "employee") {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "0 0 80px" }}>
        <TopBar title="Company" subtitle="Joined workspace" onBack={onExit} />
        <div style={{ padding: "20px 24px", display: "grid", gap: 16 }}>
          <div style={{ background: COLORS.card, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
            <div style={{ color: COLORS.white, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {companyInfo?.name || "Your Company"}
            </div>
            <div style={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.5 }}>
              You are an employee of this company. Your personal carbon tracking remains in the main dashboard tabs. This section shows your company membership status.
            </div>
          </div>
          <div style={{ background: COLORS.card, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
            <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>Membership</div>
            <div style={{ color: COLORS.accent, fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Employee</div>
            <div style={{ color: COLORS.muted, fontSize: 12 }}>
              Company ID: <span style={{ color: COLORS.white }}>{userData.company_id}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const employees = companyData?.employees || [];
  const recentLogs = companyData?.recent_logs || [];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 0 80px" }}>
      <TopBar title={companyData.company_name} subtitle={`${companyData.total_employees} employees • admin workspace`} onBack={onExit} />

      <div style={{ padding: "20px 24px" }}>
        {activeTab === "overview" ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              <MetricCard title="Active Today" value={`${companyData.active_today}/${companyData.total_employees}`} subtitle="Employees who logged" />
              <MetricCard title="Team CO2 Today" value={`${companyData.total_company_co2}kg`} subtitle="Combined footprint" color={COLORS.blue} />
              <MetricCard title="Avg Per Active" value={`${companyData.avg_co2_per_employee}kg`} subtitle="Across active employees" color={COLORS.yellow} />
              <MetricCard title="Logs (30d)" value={`${companyData.total_logs_month}`} subtitle="Company activity volume" color={COLORS.white} />
            </div>

            <div style={{ background: COLORS.card, borderRadius: 12, padding: 18, border: `1px solid ${COLORS.border}` }}>
              <div style={{ color: COLORS.white, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Employee joining ID</div>
              <div style={{ color: COLORS.muted, fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
                Share this company ID with employees. Individual accounts can join your workspace from their Company tab using this ID.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  readOnly
                  value={companyData.company_id}
                  style={{
                    flex: 1,
                    padding: 10,
                    background: COLORS.bg,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    color: COLORS.white,
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={() => navigator.clipboard.writeText(companyData.company_id)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: COLORS.accent,
                    color: COLORS.bg,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "employees" ? (
          <div style={{ display: "grid", gap: 12 }}>
            {employees.map((employee, index) => (
              <EmployeeCard key={employee.user_id} employee={employee} rank={index + 1} />
            ))}
          </div>
        ) : null}

        {activeTab === "logs" ? (
          <div style={{ display: "grid", gap: 12 }}>
            {recentLogs.length > 0 ? (
              recentLogs.map((log, index) => <LogRow key={`${log.user_id}-${log.date}-${index}`} log={log} />)
            ) : (
              <div style={{ background: COLORS.card, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, color: COLORS.muted }}>
                No company logs yet.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
