// frontend/src/components/PYQTab.jsx
// Complete Previous Year Questions tab for the Topic Page.
// Shows PYQs with year filter, quiz mode, and explanation reveal.
//
// Usage in Topicpage.jsx:
//   import PYQTab from "../components/PYQTab";
//   // Add "pyq" to tabs array
//   // Render: {activeTab === "pyq" && <PYQTab subject={subjectName} topic={topicName} />}

import { useState, useEffect } from "react";
import axios from "axios";
import { authHeader } from "../utils/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "https://ai-edtech-backend-r2y7.onrender.com";

/* ── Option Row ── */
function OptionRow({ opt, i, isSelected, isRevealed, isCorrect, onClick }) {
  let bg = "var(--bg-card)", border = "1.5px solid var(--border-color)",
      circBg = "var(--bg-secondary)", circColor = "var(--text-muted)", textColor = "var(--text-primary)";

  if (isRevealed) {
    if (isCorrect)           { bg = "var(--bg-secondary)"; border = "3px solid #22c55e"; circBg = "#22c55e"; circColor = "white"; textColor = "#16a34a"; }
    else if (isSelected)     { bg = "var(--bg-secondary)"; border = "3px solid #ef4444"; circBg = "#ef4444"; circColor = "white"; textColor = "#dc2626"; }
    else                     { bg = "var(--bg-card)";      border = "1.5px solid var(--border-color)"; }
  } else if (isSelected)     { bg = "var(--bg-hover)";     border = "2px solid #6366f1"; circBg = "#6366f1"; circColor = "white"; }

  return (
    <div onClick={!isRevealed ? onClick : undefined}
      style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px", border, background: bg, cursor: isRevealed ? "default" : "pointer", transition: "all 0.15s", marginBottom: "8px" }}>
      <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: circBg, color: circColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
        {String.fromCharCode(65 + i)}
      </span>
      <span style={{ fontSize: "14px", color: textColor, fontWeight: isRevealed && (isCorrect || isSelected) ? 600 : 400 }}>{opt}</span>
      {isRevealed && isCorrect    && <span style={{ marginLeft: "auto", fontSize: "12px", color: "#16a34a", fontWeight: 700, flexShrink: 0 }}>✓ Correct</span>}
      {isRevealed && isSelected && !isCorrect && <span style={{ marginLeft: "auto", fontSize: "12px", color: "#dc2626", fontWeight: 700, flexShrink: 0 }}>✗ Wrong</span>}
    </div>
  );
}

/* ── Single PYQ Card ── */
function PYQCard({ pyq, index }) {
  const [selected,  setSelected]  = useState(null);
  const [revealed,  setRevealed]  = useState(false);
  const [showExp,   setShowExp]   = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setRevealed(true);
  };

  const isCorrect = selected === pyq.correctAnswer;

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: "14px", border: `1.5px solid ${revealed ? (isCorrect ? "#22c55e" : "#ef4444") : "var(--border-color)"}`, padding: "20px 22px", marginBottom: "16px", boxShadow: "var(--shadow-sm)" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: "#eef2ff", color: "#4338ca" }}>
            GATE {pyq.year}
          </span>
          <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "20px", background: pyq.marks === 2 ? "#fef3c7" : "#f0fdf4", color: pyq.marks === 2 ? "#92400e" : "#166534", fontWeight: 600 }}>
            {pyq.marks} mark{pyq.marks > 1 ? "s" : ""}
          </span>
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>Q{index + 1}</span>
      </div>

      {/* Question */}
      <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px", lineHeight: 1.6 }}>{pyq.question}</p>

      {/* Options */}
      <div style={{ marginBottom: "14px" }}>
        {pyq.options.map((opt, i) => (
          <OptionRow key={i} opt={opt} i={i}
            isSelected={selected === i}
            isRevealed={revealed}
            isCorrect={i === pyq.correctAnswer}
            onClick={() => !revealed && setSelected(i)} />
        ))}
      </div>

      {/* Actions */}
      {!revealed ? (
        <button onClick={handleSubmit} disabled={selected === null}
          style={{ padding: "9px 24px", borderRadius: "8px", border: "none", background: selected === null ? "var(--bg-secondary)" : "linear-gradient(90deg,#6366f1,#8b5cf6)", color: selected === null ? "var(--text-muted)" : "white", fontSize: "14px", fontWeight: 600, cursor: selected === null ? "not-allowed" : "pointer" }}>
          Check Answer
        </button>
      ) : (
        <div>
          {/* Result pill */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, padding: "4px 14px", borderRadius: "20px", background: isCorrect ? "#dcfce7" : "#fee2e2", color: isCorrect ? "#166534" : "#991b1b" }}>
              {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
            </span>
            <button onClick={() => { setSelected(null); setRevealed(false); setShowExp(false); }}
              style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "20px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer" }}>
              Try again
            </button>
          </div>

          {/* Explanation toggle */}
          {pyq.explanation && (
            <div>
              <button onClick={() => setShowExp(v => !v)}
                style={{ fontSize: "12px", padding: "5px 14px", borderRadius: "8px", border: "1px solid #c4b5fd", background: "var(--bg-card)", color: "#7c3aed", cursor: "pointer", fontWeight: 600 }}>
                {showExp ? "Hide explanation" : "💡 Show explanation"}
              </button>
              {showExp && (
                <div style={{ marginTop: "10px", padding: "12px 16px", background: "var(--bg-secondary)", border: "1px solid #ddd6fe", borderLeft: "4px solid #7c3aed", borderRadius: "8px", fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.7 }}>
                  {pyq.explanation}
                </div>
              )}
            </div>
          )}

          {/* Official link */}
          {pyq.pyqLink && (
            <a href={pyq.pyqLink} target="_blank" rel="noreferrer"
              style={{ display: "inline-block", marginTop: "10px", fontSize: "12px", color: "#6366f1", textDecoration: "none", fontWeight: 500 }}>
              📄 View in official GATE paper →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main PYQ Tab ── */
export default function PYQTab({ subject, topic }) {
  const [pyqs,       setPyqs]       = useState([]);
  const [years,      setYears]      = useState([]);
  const [filterYear, setFilterYear] = useState("all");
  const [loading,    setLoading]    = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [score,      setScore]      = useState(null); // null = not done

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      axios.get(`${BASE_URL}/api/pyq/${subject}/${topic}`, { headers: authHeader() }),
      axios.get(`${BASE_URL}/api/pyq/${subject}/${topic}/years`, { headers: authHeader() }),
    ]).then(([pyqRes, yearRes]) => {
      setPyqs(pyqRes.data.pyqs || []);
      setYears(yearRes.data.years || []);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [subject, topic]);

  const filtered = filterYear === "all" ? pyqs : pyqs.filter(p => p.year === parseInt(filterYear));
  const total1m  = pyqs.filter(p => p.marks === 1).length;
  const total2m  = pyqs.filter(p => p.marks === 2).length;

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid var(--border-color)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (pyqs.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📋</p>
      <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px" }}>No PYQs yet for this topic</p>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>GATE Previous Year Questions will be added soon.</p>
    </div>
  );

  return (
    <div>
      {/* Stats bar */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px", padding: "14px 18px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#6366f1" }}>{pyqs.length}</span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total PYQs</span>
        </div>
        <div style={{ width: "1px", background: "var(--border-color)", margin: "0 4px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#16a34a" }}>{total1m}</span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>1-mark</span>
        </div>
        <div style={{ width: "1px", background: "var(--border-color)", margin: "0 4px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#d97706" }}>{total2m}</span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>2-mark</span>
        </div>
        <div style={{ width: "1px", background: "var(--border-color)", margin: "0 4px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)" }}>{years[0]}–{years[years.length - 1]}</span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Year range</span>
        </div>
      </div>

      {/* Year filter pills */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
        <button onClick={() => setFilterYear("all")}
          style={{ fontSize: "12px", padding: "5px 14px", borderRadius: "20px", border: `1.5px solid ${filterYear === "all" ? "#6366f1" : "var(--border-color)"}`, background: filterYear === "all" ? "#6366f1" : "var(--bg-card)", color: filterYear === "all" ? "white" : "var(--text-primary)", cursor: "pointer", fontWeight: 500 }}>
          All years
        </button>
        {years.map(y => (
          <button key={y} onClick={() => setFilterYear(y.toString())}
            style={{ fontSize: "12px", padding: "5px 14px", borderRadius: "20px", border: `1.5px solid ${filterYear === y.toString() ? "#6366f1" : "var(--border-color)"}`, background: filterYear === y.toString() ? "#6366f1" : "var(--bg-card)", color: filterYear === y.toString() ? "white" : "var(--text-primary)", cursor: "pointer", fontWeight: 500 }}>
            GATE {y}
          </button>
        ))}
      </div>

      {/* Notice */}
      <div style={{ padding: "10px 16px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px", marginBottom: "20px", fontSize: "13px", color: "#92400e" }}>
        📌 These questions are from GATE CS previous years. Attempt each question before revealing the answer and explanation.
      </div>

      {/* PYQ cards */}
      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>No PYQs for GATE {filterYear}</p>
      ) : (
        filtered.map((pyq, i) => <PYQCard key={pyq._id || i} pyq={pyq} index={i} />)
      )}
    </div>
  );
}