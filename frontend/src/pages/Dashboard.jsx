// frontend/src/pages/Dashboard.jsx
// FINAL — Leaderboard button added, uses BASE_URL

import React, { useEffect, useState } from "react";
import SubjectCard from "../components/SubjectCard";
import DailyQuote  from "../components/DailyQuote";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authHeader, isLoggedIn, getUserName } from "../utils/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const flameColor = (n) => {
  if (!n || n === 0) return "#9ca3af";
  if (n >= 14) return "#ef4444";
  if (n >= 7)  return "#f97316";
  if (n >= 3)  return "#f59e0b";
  return "#22c55e";
};

const streakMessage = (n) => {
  if (!n || n === 0) return "Complete a test to start your streak!";
  if (n >= 30) return "Legendary! 30+ day streak 🏆";
  if (n >= 14) return "You're on fire! 🔥";
  if (n >= 7)  return "One week strong! Keep going!";
  if (n >= 3)  return "Building momentum!";
  return "Great start! Keep it up!";
};

const subjects = [
  { key: "operating-systems",     title: "Operating Systems"           },
  { key: "computer-networks",     title: "Computer Networks"           },
  { key: "data-structures",       title: "Data Structures"             },
  { key: "algorithms",            title: "Algorithms"                  },
  { key: "dbms",                  title: "Database Management Systems" },
  { key: "compiler-design",       title: "Compiler Design"             },
  { key: "discrete-mathematics",  title: "Discrete Mathematics"        },
  { key: "theory-of-computation", title: "Theory of Computation"       },
];

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => { if (!isLoggedIn()) navigate("/login"); }, [navigate]);

  const [streak, setStreak] = useState({
    currentStreak: 0, longestStreak: 0, lastStudyDate: null,
    studiedToday: false, studyDates: []
  });

  const fetchStreak = () => {
    axios.get(`${BASE_URL}/api/streak`, { headers: authHeader() })
      .then(res => setStreak(res.data))
      .catch(err => console.log("Streak fetch error:", err));
  };

  useEffect(() => {
    fetchStreak();
    window.addEventListener("focus", fetchStreak);
    return () => window.removeEventListener("focus", fetchStreak);
  }, []);

  const color     = flameColor(streak.currentStreak);
  const message   = streakMessage(streak.currentStreak);
  const hasStreak = streak.currentStreak > 0;

  const studyDateSet = new Set(streak.studyDates || []);
  const dots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    return { dateStr, studied: studyDateSet.has(dateStr) };
  });

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">

        {/* Welcome */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>
            Welcome back, {getUserName()} 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", margin: 0 }}>
            Pick up where you left off.
          </p>
        </div>

        {/* Streak banner */}
        <div style={{ background: hasStreak ? "#fff7ed" : "var(--bg-secondary)", border: `1.5px solid ${color}33`, borderRadius: "16px", padding: "20px 24px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "36px" }}>🔥</span>
            <div>
              <p style={{ margin: 0, fontSize: "28px", fontWeight: 800, color, lineHeight: 1 }}>{streak.currentStreak}</p>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>day streak</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {dots.map((dot, i) => (
              <div key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: dot.studied ? color : "var(--border-color)" }} />
            ))}
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)", flex: 1 }}>{message}</p>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>🏆 {streak.longestStreak}</p>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Best streak</p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
          {[
            { label: "📊 View Analytics",  bg: "#22c55e",                                          path: "/analytics"   },
            { label: "📅 AI Study Plan",   bg: "linear-gradient(90deg,#6366f1,#8b5cf6)",           path: "/study-plan"  },
            { label: "🏆 Leaderboard",     bg: "linear-gradient(90deg,#f59e0b,#d97706)",           path: "/leaderboard" },
          ].map((btn, i) => (
            <button key={i} onClick={() => navigate(btn.path)}
              style={{ padding: "10px 20px", background: btn.bg, border: "none", borderRadius: "8px", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
              {btn.label}
            </button>
          ))}
        </div>

        {/* Daily Quote */}
        <DailyQuote />

        {/* Subject grid */}
        <div className="subjects-grid">
          {subjects.map((subject, index) => (
            <SubjectCard key={index} subjectKey={subject.key} title={subject.title} />
          ))}
        </div>

      </div>
      <div className="floating-ai">🤖</div>
    </div>
  );
};

export default Dashboard;