// frontend/src/pages/ProfilePage.jsx
// FULLY REWRITTEN — shows user credentials, streak stats, progress summary
// and has a working change password form. Dark mode fully supported.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authHeader, clearAuth, isLoggedIn } from "../utils/auth";

export default function ProfilePage() {
  const navigate = useNavigate();

  const [user,        setUser]        = useState(null);
  const [streak,      setStreak]      = useState(null);
  const [analytics,   setAnalytics]   = useState(null);
  const [loading,     setLoading]     = useState(true);

  /* Password change state */
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [pwMsg,       setPwMsg]       = useState({ text: "", type: "" }); // type: success | error
  const [pwLoading,   setPwLoading]   = useState(false);
  const [showPwForm,  setShowPwForm]  = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }

    Promise.all([
      axios.get("http://localhost:5000/api/auth/me",        { headers: authHeader() }),
      axios.get("http://localhost:5000/api/streak",         { headers: authHeader() }),
      axios.get("http://localhost:5000/api/analytics",      { headers: authHeader() }),
    ]).then(([userRes, streakRes, analyticsRes]) => {
      setUser(userRes.data);
      setStreak(streakRes.data);
      setAnalytics(analyticsRes.data);
    }).catch(err => console.log(err))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPw) {
      setPwMsg({ text: "Please fill in all fields.", type: "error" }); return;
    }
    if (newPassword !== confirmPw) {
      setPwMsg({ text: "New passwords do not match.", type: "error" }); return;
    }
    if (newPassword.length < 6) {
      setPwMsg({ text: "New password must be at least 6 characters.", type: "error" }); return;
    }
    setPwLoading(true); setPwMsg({ text: "", type: "" });
    try {
      await axios.post("http://localhost:5000/api/auth/change-password",
        { email: user.email, oldPassword, newPassword },
        { headers: authHeader() });
      setPwMsg({ text: "Password updated successfully! 🎉", type: "success" });
      setOldPassword(""); setNewPassword(""); setConfirmPw("");
      setTimeout(() => setShowPwForm(false), 2000);
    } catch (err) {
      setPwMsg({ text: err.response?.data?.message || "Failed to update password.", type: "error" });
    }
    setPwLoading(false);
  };

  const handleLogout = () => { clearAuth(); navigate("/login"); };

  /* ── derived stats ── */
  const allTopics    = analytics ? Object.values(analytics.topics).flat() : [];
  const strong       = allTopics.filter(t => t.score >= 70).length;
  const weak         = allTopics.filter(t => t.score <  40).length;
  const attempted    = allTopics.length;
  const avgScore     = attempted ? Math.round(allTopics.reduce((a, b) => a + b.score, 0) / attempted) : 0;

  const flameColor = () => {
    if (!streak?.currentStreak) return "#9ca3af";
    if (streak.currentStreak >= 14) return "#ef4444";
    if (streak.currentStreak >= 7)  return "#f97316";
    if (streak.currentStreak >= 3)  return "#f59e0b";
    return "#22c55e";
  };

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid var(--border-color)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "12px" }}>Loading profile...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>My Profile</h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>Manage your account and view your learning stats</p>
      </div>

      {/* ── PROFILE CARD ── */}
      <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow-sm)", marginBottom: "20px" }}>
        {/* Accent bar */}
        <div style={{ height: "4px", background: "linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)" }} />

        <div style={{ padding: "28px" }}>
          {/* Avatar + Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 700, color: "white", flexShrink: 0 }}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{user?.name}</h2>
              <p style={{ margin: "0 0 6px", fontSize: "14px", color: "var(--text-secondary)" }}>{user?.email}</p>
              <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "20px", background: "#eef2ff", color: "#4338ca", fontWeight: 600 }}>
                🎓 GATE Aspirant
              </span>
            </div>
          </div>

          {/* Info rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              { label: "Full name",   value: user?.name  },
              { label: "Email",       value: user?.email },
              { label: "Member since", value: joinDate   },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500, minWidth: "130px" }}>{row.label}</span>
                <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Change password toggle */}
          <div style={{ marginTop: "20px" }}>
            <button onClick={() => { setShowPwForm(v => !v); setPwMsg({ text: "", type: "" }); }}
              style={{ fontSize: "13px", padding: "8px 18px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)", cursor: "pointer", fontWeight: 500 }}>
              {showPwForm ? "✕ Cancel" : "🔒 Change Password"}
            </button>

            {showPwForm && (
              <div style={{ marginTop: "20px", padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>Change Password</h3>

                {[
                  { label: "Current password", val: oldPassword, set: setOldPassword, placeholder: "Enter current password" },
                  { label: "New password",      val: newPassword, set: setNewPassword, placeholder: "Min. 6 characters" },
                  { label: "Confirm new password", val: confirmPw, set: setConfirmPw, placeholder: "Repeat new password" },
                ].map((field, i) => (
                  <div key={i} style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      {field.label}
                    </label>
                    <input
                      type="password"
                      placeholder={field.placeholder}
                      value={field.val}
                      onChange={e => field.set(e.target.value)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                    />
                  </div>
                ))}

                {pwMsg.text && (
                  <div style={{ padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", background: pwMsg.type === "success" ? "#dcfce7" : "#fee2e2", color: pwMsg.type === "success" ? "#166534" : "#991b1b", fontSize: "13px", fontWeight: 500 }}>
                    {pwMsg.text}
                  </div>
                )}

                <button onClick={handleChangePassword} disabled={pwLoading}
                  style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "white", fontSize: "14px", fontWeight: 600, cursor: pwLoading ? "not-allowed" : "pointer", opacity: pwLoading ? 0.7 : 1 }}>
                  {pwLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STREAK CARD ── */}
      {streak && (
        <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", padding: "24px", boxShadow: "var(--shadow-sm)", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>🔥 Study Streak</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { label: "Current streak", value: `${streak.currentStreak} days`, color: flameColor() },
              { label: "Best streak",    value: `${streak.longestStreak} days`, color: "#6366f1" },
              { label: "Studied today",  value: streak.studiedToday ? "✓ Yes" : "✗ Not yet", color: streak.studiedToday ? "#16a34a" : "#dc2626" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "16px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                <p style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* 7-day dots */}
          <div style={{ marginTop: "20px" }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last 7 days</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                const studied = (streak.studyDates || []).includes(dateStr);
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: studied ? flameColor() : "var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                      {studied ? "🔥" : ""}
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{["S","M","T","W","T","F","S"][d.getDay()]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── LEARNING STATS ── */}
      <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", padding: "24px", boxShadow: "var(--shadow-sm)", marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>📊 Learning Stats</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {[
            { label: "Topics done",   value: attempted,    color: "var(--text-primary)" },
            { label: "Avg score",     value: `${avgScore}%`, color: avgScore >= 70 ? "#16a34a" : avgScore >= 40 ? "#d97706" : "#dc2626" },
            { label: "Strong",        value: strong,       color: "#16a34a" },
            { label: "Need work",     value: weak,         color: "#dc2626" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "16px 12px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
              <p style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 800, color: s.color }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── DANGER ZONE ── */}
      <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>Account</h3>
        <button onClick={handleLogout}
          style={{ padding: "10px 24px", borderRadius: "8px", border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
          Logout →
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}