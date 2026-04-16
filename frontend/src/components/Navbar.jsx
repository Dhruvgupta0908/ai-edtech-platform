// frontend/src/components/Navbar.jsx
// FIXED — dark mode toggle is now ALWAYS visible, even when logged out.
// Previously it was inside the isLoggedIn() block — moved outside.

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { authHeader, clearAuth, isLoggedIn, getUserName } from "../utils/auth";
import useDarkMode from "../hooks/useDarkMode";

function Navbar() {
  const navigate            = useNavigate();
  const [streak, setStreak] = useState(null);
  const { isDark, toggle }  = useDarkMode();

  const fetchStreak = () => {
    if (!isLoggedIn()) return;
    axios
      .get("https://ai-edtech-backend-r2y7.onrender.com/api/streak", { headers: authHeader() })
      .then(res => setStreak(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchStreak();
    window.addEventListener("focus", fetchStreak);
    return () => window.removeEventListener("focus", fetchStreak);
  }, []);

  const flameColor = () => {
    if (!streak || streak.currentStreak === 0) return "#9ca3af";
    if (streak.currentStreak >= 14) return "#ef4444";
    if (streak.currentStreak >= 7)  return "#f97316";
    if (streak.currentStreak >= 3)  return "#f59e0b";
    return "#22c55e";
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <nav className="navbar">

      <h2 className="logo">CoreMind AI</h2>

      {/* ── NAV LINKS ── */}
      <ul>
        <li><Link to="/">Home</Link></li>
        {isLoggedIn() && <li><Link to="/dashboard">Dashboard</Link></li>}
        {isLoggedIn() && <li><Link to="/study-plan">Study Plan</Link></li>}
        {isLoggedIn() && <li><Link to="/analytics">Analytics</Link></li>}
        {isLoggedIn() && <li><Link to="/profile">Profile</Link></li>}
        {!isLoggedIn() && <li><Link to="/login">Login</Link></li>}
      </ul>

      {/* ── RIGHT SIDE: toggle + streak + user ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

        {/* DARK MODE TOGGLE — always visible, logged in or not */}
        <button
          onClick={toggle}
          className="dark-toggle"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? "☀️" : "🌙"}
        </button>

        {/* STREAK PILL — only when logged in */}
        {isLoggedIn() && streak !== null && (
          <div style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "6px",
            background:   streak.currentStreak > 0 ? "#fff7ed" : "var(--bg-hover)",
            border:       `1.5px solid ${flameColor()}44`,
            borderRadius: "20px",
            padding:      "5px 14px",
            cursor:       "default"
          }}
            title={`Current streak: ${streak.currentStreak} days | Best: ${streak.longestStreak} days`}
          >
            <span style={{ fontSize: "16px", lineHeight: 1 }}>🔥</span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: flameColor(), lineHeight: 1 }}>
              {streak.currentStreak}
            </span>
            <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500 }}>
              day streak
            </span>
            {streak.studiedToday && (
              <span style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#22c55e", marginLeft: "2px", flexShrink: 0
              }}
                title="You've already studied today!"
              />
            )}
          </div>
        )}

        {/* USER GREETING + LOGOUT — only when logged in */}
        {isLoggedIn() && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
              Hi, {getUserName()}
            </span>
            <button
              onClick={handleLogout}
              style={{
                fontSize:   "13px",
                padding:    "5px 14px",
                borderRadius: "8px",
                border:     "1px solid var(--border-color)",
                background: "var(--bg-hover)",
                color:      "var(--text-primary)",
                cursor:     "pointer",
                fontWeight: 500
              }}
            >
              Logout
            </button>
          </div>
        )}

      </div>
    </nav>
  );
}

export default Navbar;