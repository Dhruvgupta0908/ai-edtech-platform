// frontend/src/pages/SubjectPage.jsx
// FIXED — all hardcoded inline colors replaced with CSS variables for dark mode

import { useParams, useNavigate } from "react-router-dom";
import subjectsData from "../data/SubjectsData";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { authHeader } from "../utils/auth";

const slugify = (text) =>
  text.toLowerCase()
    .replace(/\//g, "-").replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "").replace(/--+/g, "-");

function SocraticTutorPanel({ topic, subjectName, score, onClose }) {
  const [step, setStep]                   = useState("idle");
  const [tutorMsg, setTutorMsg]           = useState("");
  const [userReply, setUserReply]         = useState("");
  const [followUp, setFollowUp]           = useState("");
  const [followLoading, setFollowLoading] = useState(false);

  const startSession = async () => {
    setStep("loading");
    try {
      const res = await axios.post("http://localhost:5000/api/ai/socratic",
        { topic: topic.title, subject: subjectName, score, mode: "topic_review", context: `Score: ${score}% on "${topic.title}".` },
        { headers: authHeader() });
      setTutorMsg(res.data.tutorQuestion); setStep("question");
    } catch { setTutorMsg("Tutor unavailable. Try reviewing the theory."); setStep("question"); }
  };

  const handleFollowUp = async () => {
    if (!userReply.trim()) return;
    setFollowLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/ai/socratic",
        { topic: topic.title, subject: subjectName, score, mode: "follow_up", context: `Tutor: "${tutorMsg}". Student: "${userReply}".` },
        { headers: authHeader() });
      setFollowUp(res.data.tutorQuestion);
    } catch { setFollowUp("Good thinking! Go through the topic again."); }
    setFollowLoading(false);
  };

  return (
    <div style={{ marginTop: "14px", background: "var(--bg-secondary)", border: "1px solid #7c3aed44", borderRadius: "10px", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ background: "#7c3aed", color: "white", fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", textTransform: "uppercase" }}>AI Tutor</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "var(--text-muted)" }}>✕</button>
      </div>
      {step === "idle" && (
        <div>
          <p style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "14px", lineHeight: 1.6 }}>
            Score on <strong>{topic.title}</strong>: <strong style={{ color: "#ef4444" }}>{score}%</strong>
          </p>
          <button onClick={startSession} style={{ background: "#7c3aed", color: "white", border: "none", padding: "8px 18px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
            Start AI Tutoring Session
          </button>
        </div>
      )}
      {step === "loading" && <p style={{ color: "#7c3aed", fontSize: "14px", fontStyle: "italic" }}>Thinking...</p>}
      {step === "question" && (
        <div>
          <div style={{ display: "flex", gap: "10px", background: "var(--bg-hover)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "12px 14px" }}>
            <span>🤔</span>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6, fontStyle: "italic" }}>{tutorMsg}</p>
          </div>
          {!followUp && (
            <div style={{ marginTop: "14px" }}>
              <textarea rows={3} placeholder="Type your thinking..." value={userReply} onChange={e => setUserReply(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "14px", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", color: "var(--text-primary)", background: "var(--bg-input)" }} />
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button onClick={handleFollowUp} disabled={followLoading || !userReply.trim()}
                  style={{ background: "#7c3aed", color: "white", border: "none", padding: "8px 18px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                  {followLoading ? "Thinking..." : "Submit"}
                </button>
                <button onClick={() => setStep("reveal")} style={{ background: "none", border: "1px solid var(--border-color)", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
                  Show me the concept
                </button>
              </div>
            </div>
          )}
          {followUp && (
            <div style={{ display: "flex", gap: "10px", marginTop: "14px", background: "var(--bg-hover)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "12px 14px" }}>
              <span>💡</span>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6, fontStyle: "italic" }}>{followUp}</p>
            </div>
          )}
        </div>
      )}
      {step === "reveal" && (
        <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "14px", fontSize: "14px", color: "var(--text-primary)" }}>
          Great effort! Now study the topic carefully and retake the quiz.
        </div>
      )}
    </div>
  );
}

function MLPredictionBanner({ predictions }) {
  const [expanded, setExpanded] = useState(false);
  const atRisk = predictions.filter(p => p.will_struggle);
  if (atRisk.length === 0) return null;
  return (
    <div style={{ background: "var(--bg-secondary)", border: "1.5px solid #fde68a", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: "#fef3c7", color: "#92400e" }}>🤖 ML Prediction</span>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
            {atRisk.length} upcoming topic{atRisk.length > 1 ? "s" : ""} flagged as high-risk
          </p>
        </div>
        <button onClick={() => setExpanded(v => !v)} style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "20px", border: "1px solid #fde68a", background: "var(--bg-card)", color: "#92400e", cursor: "pointer" }}>
          {expanded ? "Show less ▲" : "See topics ▼"}
        </button>
      </div>
      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        Based on your prerequisite scores — a Random Forest classifier flags these topics.
      </p>
      {expanded && (
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {atRisk.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "0.5px solid var(--border-color)" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>{p.title}</span>
              <div style={{ flex: 1 }} />
              <div style={{ width: "80px", height: "5px", background: "#fde68a", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round(p.confidence * 100)}%`, background: "#f59e0b" }} />
              </div>
              <span style={{ fontSize: "11px", color: "#92400e", fontWeight: 600, minWidth: "42px", textAlign: "right" }}>{Math.round(p.confidence * 100)}% risk</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectPage() {
  const { subjectName } = useParams();
  const navigate        = useNavigate();
  const subject         = subjectsData[subjectName];

  const [progressData,   setProgressData]   = useState([]);
  const [activeTutorKey, setActiveTutorKey] = useState(null);
  const [mlPredictions,  setMlPredictions]  = useState([]);

  const fetchProgress = useCallback(() => {
    axios.get("http://localhost:5000/api/analytics", { headers: authHeader() })
      .then(res => {
        const topicList = res.data.topics?.[subjectName] || [];
        setProgressData(topicList);
        const topicScores = {};
        topicList.forEach(t => { topicScores[slugify(t.topic)] = t.score; });
        if (Object.keys(topicScores).length > 0) {
          axios.post("http://localhost:5000/api/ml/predict-struggle", { subject: subjectName, topicScores }, { headers: authHeader() })
            .then(mlRes => setMlPredictions(mlRes.data.predictions || []))
            .catch(() => setMlPredictions([]));
        }
      })
      .catch(err => console.log(err));
  }, [subjectName]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);
  useEffect(() => {
    window.addEventListener("focus", fetchProgress);
    return () => window.removeEventListener("focus", fetchProgress);
  }, [fetchProgress]);

  if (!subject) return <h2 style={{ color: "var(--text-primary)" }}>Subject Not Found</h2>;

  const getScore      = (k) => { const t = progressData.find(t => slugify(t.topic) === k); return t ? t.score : 0; };
  const getScoreColor = (s) => s >= 70 ? "#16a34a" : s >= 40 ? "#d97706" : s > 0 ? "#dc2626" : "var(--text-muted)";
  const getScoreLabel = (s) => s === 0 ? null : s >= 70 ? "Strong" : s >= 40 ? "Moderate" : "Needs work";

  const mlByTitle = {};
  mlPredictions.forEach(p => { mlByTitle[p.title] = p; });

  const attempted = subject.topics.filter(t => getScore(t.key) > 0).length;
  const strong    = subject.topics.filter(t => getScore(t.key) >= 70).length;
  const weak      = subject.topics.filter(t => getScore(t.key) > 0 && getScore(t.key) < 40).length;
  const avgScore  = attempted === 0 ? 0
    : Math.round(subject.topics.filter(t => getScore(t.key) > 0).reduce((s, t) => s + getScore(t.key), 0) / attempted);
  const nextTopic = subject.topics.find(t => getScore(t.key) === 0) || subject.topics.find(t => getScore(t.key) > 0 && getScore(t.key) < 40) || null;

  return (
    <div style={{ padding: "40px", maxWidth: "860px", margin: "0 auto" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>{subject.title}</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px" }}>{subject.topics.length} topics</p>
        </div>
        <button onClick={() => navigate(`/concept-map/${subjectName}`)}
          style={{ padding: "9px 18px", borderRadius: "8px", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "white", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
          🗺 Concept Map
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[{ label: "Avg score", value: `${avgScore}%` }, { label: "Attempted", value: `${attempted}/${subject.topics.length}` }, { label: "Strong", value: strong }, { label: "Weak", value: weak }].map((s, i) => (
          <div key={i} style={{ background: "var(--bg-card)", borderRadius: "10px", padding: "14px 16px", boxShadow: "var(--shadow-sm)", textAlign: "center", border: "1px solid var(--border-color)" }}>
            <p style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <MLPredictionBanner predictions={mlPredictions} />

      {nextTopic && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px 20px", marginBottom: "28px" }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#3b82f6", fontWeight: 600, textTransform: "uppercase" }}>Recommended next</p>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>{nextTopic.title}</p>
          </div>
          <button onClick={() => navigate(`/topic/${subjectName}/${nextTopic.key}`)}
            style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>
            Study now →
          </button>
        </div>
      )}

      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>All Topics</h3>

      {subject.topics.map((topic, index) => {
        const score      = getScore(topic.key);
        const scoreColor = getScoreColor(score);
        const label      = getScoreLabel(score);
        const isWeak     = score > 0 && score < 40;
        const tutorOpen  = activeTutorKey === topic.key;
        const mlPred     = mlByTitle[topic.title];
        const isAtRisk   = mlPred?.will_struggle && score === 0;

        return (
          <div key={index} style={{ background: "var(--bg-card)", borderRadius: "10px", padding: "14px 16px", marginBottom: "10px", boxShadow: "var(--shadow-sm)", border: isAtRisk ? "1.5px solid #fde68a" : "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>{topic.title}</span>
                {isAtRisk && <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: "#fef3c7", color: "#92400e" }}>⚠ At Risk</span>}
                {score > 0 && <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "20px", border: `1px solid ${scoreColor}`, color: scoreColor, fontWeight: 500 }}>{score}% · {label}</span>}
                {score === 0 && !isAtRisk && <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>Not started</span>}
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                {isWeak && (
                  <button onClick={() => setActiveTutorKey(tutorOpen ? null : topic.key)}
                    style={{ padding: "6px 14px", borderRadius: "6px", border: `1px solid ${tutorOpen ? "#7c3aed" : "#c4b5fd"}`, background: tutorOpen ? "#ede9fe" : "var(--bg-card)", color: tutorOpen ? "#5b21b6" : "#7c3aed", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>
                    {tutorOpen ? "Close tutor" : "AI Tutor"}
                  </button>
                )}
                <button onClick={() => navigate(`/topic/${subjectName}/${topic.key}`)}
                  style={{ background: isAtRisk ? "#d97706" : "#3b82f6", color: "white", border: "none", padding: "6px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>
                  {score === 0 ? "Start" : "Retry"}
                </button>
              </div>
            </div>
            {score > 0 && (
              <div style={{ height: "4px", background: "var(--border-color)", borderRadius: "4px", marginTop: "10px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${score}%`, background: scoreColor, borderRadius: "4px", transition: "width 0.4s ease" }} />
              </div>
            )}
            {isAtRisk && (
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#92400e" }}>ML risk:</span>
                <div style={{ flex: 1, height: "4px", background: "#fde68a", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round(mlPred.confidence * 100)}%`, background: "#f59e0b" }} />
                </div>
                <span style={{ fontSize: "11px", color: "#92400e", fontWeight: 600 }}>{Math.round(mlPred.confidence * 100)}%</span>
              </div>
            )}
            {tutorOpen && <SocraticTutorPanel topic={topic} subjectName={subjectName} score={score} onClose={() => setActiveTutorKey(null)} />}
          </div>
        );
      })}
    </div>
  );
}

export default SubjectPage;