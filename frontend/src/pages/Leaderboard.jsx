// frontend/src/pages/Leaderboard.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import { authHeader } from "../utils/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const MEDALS   = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    axios.get(`${BASE_URL}/api/analytics/leaderboard`, { headers: authHeader() })
      .then(res => setLeaderboard(res.data.leaderboard || []))
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div style={{ width: "36px", height: "36px", border: "3px solid var(--border-color)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <p style={{ fontSize: "40px", margin: "0 0 8px" }}>🏆</p>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>Leaderboard</h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>Top performers across all 8 subjects</p>
      </div>

      {/* Podium — top 3 */}
      {leaderboard.length >= 3 && (
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "12px", marginBottom: "36px" }}>
          {/* Order: 2nd, 1st, 3rd */}
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, podiumPos) => {
            const heights = ["80px", "110px", "70px"];
            const colors  = ["#94a3b8", "#f59e0b", "#cd7f32"];
            const ranks   = [2, 1, 3];
            return (
              <div key={podiumPos} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <p style={{ fontSize: "28px", margin: 0 }}>{MEDALS[ranks[podiumPos] - 1]}</p>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: `linear-gradient(135deg,${colors[podiumPos]},${colors[podiumPos]}88)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "16px", fontWeight: 700 }}>
                  {entry?.name?.charAt(0)?.toUpperCase()}
                </div>
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: entry?.isCurrentUser ? "#6366f1" : "var(--text-primary)", textAlign: "center", maxWidth: "80px", wordBreak: "break-word" }}>
                  {entry?.name} {entry?.isCurrentUser ? "(You)" : ""}
                </p>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: colors[podiumPos] }}>{entry?.avgScore}%</p>
                <div style={{ width: "80px", height: heights[podiumPos], background: colors[podiumPos] + "22", border: `2px solid ${colors[podiumPos]}`, borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "18px", fontWeight: 800, color: colors[podiumPos] }}>#{ranks[podiumPos]}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {leaderboard.map((entry, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderRadius: "12px", background: entry.isCurrentUser ? "var(--bg-hover)" : "var(--bg-card)", border: entry.isCurrentUser ? "1.5px solid #6366f1" : "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
            {/* Rank badge */}
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: i < 3 ? ["#fef3c7","#f1f5f9","#fff7ed"][i] : "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {i < 3
                ? <span style={{ fontSize: "16px" }}>{MEDALS[i]}</span>
                : <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>#{entry.rank}</span>}
            </div>

            {/* Avatar */}
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
              {entry.name.charAt(0).toUpperCase()}
            </div>

            {/* Name + meta */}
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                {entry.name}
                {entry.isCurrentUser && <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "20px", background: "#eef2ff", color: "#4338ca", fontWeight: 700 }}>You</span>}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>{entry.topicsAttempted} topics attempted</p>
            </div>

            {/* Score */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ margin: "0 0 2px", fontSize: "20px", fontWeight: 800, color: entry.avgScore >= 70 ? "#16a34a" : entry.avgScore >= 40 ? "#d97706" : "#dc2626" }}>
                {entry.avgScore}%
              </p>
              <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)" }}>avg score</p>
            </div>
          </div>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: "32px", margin: "0 0 12px" }}>🎯</p>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px" }}>No data yet</p>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Be the first to complete a topic and appear here!</p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}