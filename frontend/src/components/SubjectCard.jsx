// frontend/src/components/SubjectCard.jsx
// UPGRADED — shows circular progress ring + avg score bar on each subject card

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { authHeader } from "../utils/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ProgressRing({ percent, size = 52, stroke = 4, color }) {
  const radius       = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset       = circumference - (percent / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}
        fontSize="10" fontWeight="700" fill={color}>{percent}%</text>
    </svg>
  );
}

const SUBJECT_EMOJI = {
  "operating-systems": "💻", "computer-networks": "🌐",
  "data-structures": "🧠", "algorithms": "⚙️",
  "dbms": "🗄️", "compiler-design": "🔧",
  "discrete-mathematics": "📐", "theory-of-computation": "🤖",
};

export default function SubjectCard({ subjectKey, title }) {
  const navigate = useNavigate();
  const [prog, setProg] = useState({ attempted: 0, total: 10, avgScore: 0 });

  useEffect(() => {
    axios.get(`${BASE_URL}/api/analytics`, { headers: authHeader() })
      .then(res => {
        const list = res.data.topics?.[subjectKey] || [];
        const avg  = list.length === 0 ? 0 : Math.round(list.reduce((s, t) => s + t.score, 0) / list.length);
        setProg({ attempted: list.length, total: 10, avgScore: avg });
      }).catch(() => {});
  }, [subjectKey]);

  const pct   = Math.round((prog.attempted / prog.total) * 100);
  const color = prog.avgScore >= 70 ? "#22c55e" : prog.avgScore >= 40 ? "#f59e0b" : prog.attempted > 0 ? "#ef4444" : "#94a3b8";
  const label = prog.attempted === 0 ? "Not started" : prog.attempted === prog.total ? "✓ Completed" : `${prog.attempted}/${prog.total} topics done`;

  return (
    <div onClick={() => navigate(`/subject/${subjectKey}`)}
      style={{ background: "var(--bg-card)", borderRadius: "14px", padding: "20px", border: "1px solid var(--border-color)", cursor: "pointer", transition: "all 0.2s", boxShadow: "var(--shadow-sm)" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
          {SUBJECT_EMOJI[subjectKey] || "📚"}
        </div>
        <ProgressRing percent={pct} color={color} />
      </div>

      <p style={{ margin: "0 0 3px", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>{title}</p>
      <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--text-muted)" }}>{label}</p>

      {prog.attempted > 0 ? (
        <div>
          <div style={{ height: "4px", background: "var(--border-color)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${prog.avgScore}%`, background: color, borderRadius: "4px", transition: "width 0.6s" }} />
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>avg score {prog.avgScore}%</p>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: "13px", color: "#6366f1", fontWeight: 600 }}>Start learning →</p>
      )}
    </div>
  );
}