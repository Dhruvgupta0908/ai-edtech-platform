// frontend/src/components/Sidebar.jsx
// UPDATED — added Study Plan link

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { authHeader, clearAuth, isLoggedIn } from "../utils/auth";

function Sidebar() {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) return;
    axios
      .get("https://ai-edtech-backend-r2y7.onrender.com/api/streak", { headers: authHeader() })
      .then(res => setStreak(res.data))
      .catch(() => {});
  }, []);

  const flameColor = () => {
    if (!streak || streak.currentStreak === 0) return "#9ca3af";
    if (streak.currentStreak >= 14) return "#ef4444";
    if (streak.currentStreak >= 7)  return "#f97316";
    if (streak.currentStreak >= 3)  return "#f59e0b";
    return "#22c55e";
  };

  const logout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="sidebar">
      <h2>CoreMind AI</h2>

      {/* ── STREAK PILL ── */}
      {streak !== null && (
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          "8px",
          background:   streak.currentStreak > 0 ? "#fff7ed" : "#f8fafc",
          border:       `1.5px solid ${flameColor()}55`,
          borderRadius: "12px",
          padding:      "10px 14px",
          margin:       "12px 0 4px"
        }}>
          <span style={{ fontSize: "20px" }}>🔥</span>
          <div>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: flameColor(), lineHeight: 1 }}>
              {streak.currentStreak} days
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
              {streak.studiedToday ? "✓ Studied today" : "Study to keep streak!"}
            </p>
          </div>
          {streak.longestStreak > 0 && (
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#374151" }}>🏆 {streak.longestStreak}</p>
              <p style={{ margin: 0, fontSize: "10px", color: "#9ca3af" }}>best</p>
            </div>
          )}
        </div>
      )}

      <ul>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/study-plan">📅 Study Plan</Link></li>
        <li><Link to="/analytics">Analytics</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        <li className="logout" onClick={logout}>Logout</li>
      </ul>
    </div>
  );
}

export default Sidebar;