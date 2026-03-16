import { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext.jsx";
import { api } from './api';
import { auth } from './firebase.js';
import { signOut } from 'firebase/auth';

const COLORS = {
  bg: "#050705",
  card: "#0D110D",
  border: "#1A1F1A",
  accent: "#BAFFD1",
  yellow: "#E6D5A7",
  blue: "#A7C7E6",
  muted: "#5C665C",
  white: "#E8EEE8",
  red: "#CF9292",
};

function TopBar({ title, subtitle }) {
  const { colors } = useTheme();

  return (
    <div style={{ padding: "20px 24px 12px", borderBottom: `1px solid ${colors.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: colors.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
            CarbonIQ Company
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.white, letterSpacing: -0.5 }}>
            {title}
          </div>
          {subtitle && <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={async () => {
              await signOut(auth);
            }}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: colors.card, border: `1px solid ${colors.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, cursor: "pointer",
              color: colors.muted
            }}
            title="Logout"
          >
            ⎋
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

function EmployeeCard({ employee, onViewDetails }) {
  const { colors } = useTheme();

  return (
    <div style={{
      background: colors.card, border: `1px solid ${colors.border}`,
      borderRadius: 12, padding: 16, marginBottom: 12
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.white }}>
          {employee.name || employee.email}
        </div>
        <div style={{ fontSize: 12, color: colors.muted }}>
          {employee.role === 'admin' ? 'Admin' : 'Employee'}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: colors.muted }}>Today's CO₂</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: employee.today_co2 > 0 ? colors.accent : colors.muted }}>
            {employee.today_co2 > 0 ? `${employee.today_co2}kg` : 'Not logged'}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: colors.muted }}>This Month</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.white }}>
            {employee.monthly_co2}kg
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: colors.muted }}>Streak</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.yellow }}>
            🔥 {employee.streak}
          </div>
        </div>
      </div>
      <button
        onClick={() => onViewDetails(employee)}
        style={{
          width: "100%", padding: "8px", borderRadius: 8,
          background: colors.bg, border: `1px solid ${colors.border}`,
          color: colors.white, fontSize: 12, cursor: "pointer"
        }}
      >
        View Details
      </button>
    </div>
  );
}

export default function CompanyAdminDashboard({ user }) {
  const { colors } = useTheme();
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    async function fetchCompanyData() {
      if (!user) return;

      try {
        // Get user info to find company
        const userInfo = await api.getDashboard(user.uid);

        if (userInfo.company_id && userInfo.role === 'admin') {
          const data = await api.getCompanyDashboard(userInfo.company_id);
          setCompanyData({ ...data, company_id: userInfo.company_id, user_role: userInfo.role });
        } else {
          // Not a company admin
          setCompanyData({ error: "Access denied. You are not a company administrator." });
        }
      } catch (err) {
        console.error("Failed to load company dashboard:", err);
        setCompanyData({ error: err.message });
      }
      setLoading(false);
    }
    fetchCompanyData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ height: "100vh", background: "#0A110A", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted }}>
        Loading company dashboard...
      </div>
    );
  }

  if (!companyData || companyData.error) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0A110A",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', sans-serif",
      }}>
        <div style={{
          width: 375, height: 780,
          background: colors.bg, borderRadius: 44,
          border: `2px solid ${colors.border}`,
          boxShadow: `0 0 0 8px #0D150D, 0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(78,232,120,0.05)`,
          display: "flex", flexDirection: "column",
          overflow: "hidden", position: "relative",
          padding: 24, textAlign: "center"
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
          <h2 style={{ color: colors.white, marginBottom: 16 }}>Company Access Required</h2>
          <p style={{ color: colors.muted, marginBottom: 24 }}>
            {companyData?.error || "You need to be a company administrator to access this dashboard."}
          </p>
          <button
            onClick={async () => {
              await signOut(auth);
            }}
            style={{
              padding: "12px 24px", borderRadius: 12,
              background: colors.accent, border: "none", color: colors.bg,
              fontSize: 14, fontWeight: 600, cursor: "pointer"
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0A110A",
      display: "flex", alignItems: "center", justifyContent: "center",
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
              await signOut(auth);
            }}>Logout ⎋</span>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 0 80px" }}>
          <TopBar
            title={`${companyData.company_name} Admin`}
            subtitle={`${companyData.total_employees} employees • ${companyData.active_today} active today`}
          />

          <div style={{ padding: "20px 24px" }}>
            {/* Company Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 24 }}>
              <StatCard
                value={`${companyData.active_today}/${companyData.total_employees}`}
                label="Employees logged today"
                color={COLORS.accent}
                sub="Active today"
              />
              <StatCard
                value={companyData.total_company_co2 > 0 ? `${companyData.total_company_co2}kg` : "0kg"}
                label="Total CO₂ today"
                color={COLORS.blue}
                sub="Company footprint"
              />
              <StatCard
                value={companyData.avg_co2_per_employee > 0 ? `${companyData.avg_co2_per_employee}kg` : "0kg"}
                label="Average per employee"
                color={COLORS.yellow}
                sub="Daily average"
              />
              <StatCard
                value={`${companyData.total_logs_month}`}
                label="Logs this month"
                color={COLORS.white}
                sub="Total activity"
              />
            </div>

            {/* Company ID for sharing */}
            <div style={{
              background: colors.card, border: `1px solid ${colors.border}`,
              borderRadius: 12, padding: 16, marginBottom: 24
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.white, marginBottom: 8 }}>
                Company ID (Share with employees)
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={companyData.company_id}
                  readOnly
                  style={{
                    flex: 1,
                    padding: 8,
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 4,
                    color: colors.white,
                    fontSize: 12
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(companyData.company_id);
                    alert("Company ID copied to clipboard!");
                  }}
                  style={{
                    padding: "8px 12px",
                    background: colors.accent,
                    color: colors.bg,
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Employee List */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: colors.white, marginBottom: 16, fontSize: 18 }}>Employee Overview</h3>
              {companyData.employees && companyData.employees.length > 0 ? (
                companyData.employees.map((employee) => (
                  <EmployeeCard
                    key={employee.user_id}
                    employee={employee}
                    onViewDetails={setSelectedEmployee}
                  />
                ))
              ) : (
                <div style={{
                  background: colors.card, border: `1px solid ${colors.border}`,
                  borderRadius: 12, padding: 24, textAlign: "center"
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
                  <div style={{ color: colors.white, fontSize: 16, marginBottom: 8 }}>No employees yet</div>
                  <div style={{ color: colors.muted, fontSize: 13 }}>
                    Share your company ID with employees to get them started.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Employee Details Modal */}
        {selectedEmployee && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{
              background: colors.bg, border: `1px solid ${colors.border}`,
              borderRadius: 16, padding: 24, width: "90%", maxWidth: 320
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ color: colors.white, margin: 0 }}>
                  {selectedEmployee.name || selectedEmployee.email}
                </h3>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  style={{
                    background: "none", border: "none", color: colors.muted,
                    fontSize: 20, cursor: "pointer"
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ color: colors.muted, fontSize: 13, marginBottom: 16 }}>
                Detailed employee information and activity history would be shown here.
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ padding: 12, background: colors.card, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: colors.muted }}>Total Logs</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.white }}>
                    {selectedEmployee.total_logs || 0}
                  </div>
                </div>
                <div style={{ padding: 12, background: colors.card, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: colors.muted }}>Best Streak</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.yellow }}>
                    🔥 {selectedEmployee.best_streak || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}