// frontend/src/components/SubjectCard.jsx
// FIXED — uses CSS variables for background and text so dark mode works correctly.
// The icon circle background is darkened in dark mode via useDarkMode hook.

import { useNavigate } from "react-router-dom";
import useDarkMode from "../hooks/useDarkMode";

function SubjectCard({ subjectKey, title, icon }) {
  const navigate      = useNavigate();
  const { isDark }    = useDarkMode();

  const colors = {
    "operating-systems":     { bgLight: "#eff6ff", bgDark: "#1e2d4a", accent: "#3b82f6" },
    "computer-networks":     { bgLight: "#f0fdf4", bgDark: "#0d2d1a", accent: "#22c55e" },
    "data-structures":       { bgLight: "#fdf4ff", bgDark: "#2a1040", accent: "#a855f7" },
    "algorithms":            { bgLight: "#fff7ed", bgDark: "#2d1f0a", accent: "#f97316" },
    "dbms":                  { bgLight: "#fef2f2", bgDark: "#2d1010", accent: "#ef4444" },
    "compiler-design":       { bgLight: "#f0fdfa", bgDark: "#0a2d28", accent: "#14b8a6" },
    "discrete-mathematics":  { bgLight: "#fefce8", bgDark: "#2d2a05", accent: "#eab308" },
    "theory-of-computation": { bgLight: "#f5f3ff", bgDark: "#1e1040", accent: "#8b5cf6" },
  };

  const theme  = colors[subjectKey] || { bgLight: "#f8fafc", bgDark: "#1e293b", accent: "#64748b" };
  const iconBg = isDark ? theme.bgDark : theme.bgLight;

  return (
    <div
      onClick={() => navigate(`/subject/${subjectKey}`)}
      style={{
        background:    "var(--bg-card)",
        borderRadius:  "16px",
        padding:       "24px",
        cursor:        "pointer",
        border:        "1px solid var(--border-color)",
        boxShadow:     "var(--shadow-sm)",
        transition:    "transform 0.2s, box-shadow 0.2s",
        display:       "flex",
        flexDirection: "column",
        gap:           "12px",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "var(--shadow-lg)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
    >
      {/* Icon circle */}
      <div style={{
        width:          "48px",
        height:         "48px",
        borderRadius:   "12px",
        background:     iconBg,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontSize:       "22px",
      }}>
        {icon}
      </div>

      {/* Title */}
      <h3 style={{
        margin:     0,
        fontSize:   "15px",
        fontWeight: 600,
        color:      "var(--text-primary)",   /* ← was hardcoded #111827 */
        lineHeight: 1.4,
      }}>
        {title}
      </h3>

      {/* Start link */}
      <span style={{
        fontSize:  "13px",
        fontWeight: 500,
        color:      theme.accent,
        marginTop:  "auto",
      }}>
        Start learning →
      </span>
    </div>
  );
}

export default SubjectCard;