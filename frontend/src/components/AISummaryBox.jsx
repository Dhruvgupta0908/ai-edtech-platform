


// frontend/src/components/AISummaryBox.jsx
// DROP-IN component — add inside the theory tab in Topicpage.jsx
// Place it ABOVE the TextToSpeech component:
//   <AISummaryBox topic={topicData.title} subject={subjectName} theory={topicData.theory} />
//   <TextToSpeech text={topicData.theory} />

import { useState } from "react";
import axios from "axios";
import { authHeader } from "../utils/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "https://ai-edtech-backend-r2y7.onrender.com";

export default function AISummaryBox({ topic, subject, theory }) {
  const [status,  setStatus]  = useState("idle");
  const [points,  setPoints]  = useState([]);

  // Guard — don't render if topic data hasn't loaded yet
  if (!topic || !theory) return null;

  const getSummary = async () => {
    setStatus("loading");
    try {
      const res = await axios.post(`${BASE_URL}/api/ai/summarise`,
        { topic, subject, theory },
        { headers: authHeader() });
      setPoints(res.data.points || []);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div style={{ marginBottom: "20px", borderRadius: "12px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--bg-secondary)", borderBottom: status === "done" ? "1px solid var(--border-color)" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>⚡</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>AI Quick Summary</span>
          <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "20px", background: "#ede9fe", color: "#6d28d9", fontWeight: 700 }}>AI</span>
        </div>
        {status === "idle" && (
          <button onClick={getSummary}
            style={{ fontSize: "12px", padding: "5px 14px", borderRadius: "6px", border: "none", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "white", cursor: "pointer", fontWeight: 600 }}>
            Summarise for me →
          </button>
        )}
        {status === "done" && (
          <button onClick={() => setStatus("idle")}
            style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-muted)", cursor: "pointer" }}>
            ✕ Close
          </button>
        )}
      </div>

      {/* Loading */}
      {status === "loading" && (
        <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "16px", height: "16px", border: "2px solid var(--border-color)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
          <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic" }}>Generating summary...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", color: "#dc2626" }}>Could not generate summary. Try again.</span>
          <button onClick={getSummary} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>Retry</button>
        </div>
      )}

      {/* Summary points */}
      {status === "done" && points.length > 0 && (
        <div style={{ padding: "14px 16px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
            5 things to remember for GATE
          </p>
          {points.map((point, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#6366f1", color: "white", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                {i + 1}
              </span>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6 }}>{point}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}