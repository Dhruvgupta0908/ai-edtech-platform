// frontend/src/pages/SubjectPage.jsx
//
// PREDICTION STRATEGY:
//   1. Rule-based predictions run INSTANTLY using local score data (no API call)
//   2. ML predictions fetch in background (Flask may take 20-30s to wake up)
//   3. When ML responds, its predictions smoothly REPLACE the rule-based ones
//   4. User always sees something useful — never waits for risk info

import { useParams, useNavigate } from "react-router-dom";
import subjectsData from "../data/SubjectsData";
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { authHeader } from "../utils/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "https://ai-edtech-backend-r2y7.onrender.com";

const slugify = (text) =>
  text.toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, "-").replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "").replace(/--+/g, "-");


/* ══════════════════════════════════════════════════════
   RULE-BASED RISK ENGINE
   Runs purely on local data — zero latency.
   Returns same shape as ML: [{ title, will_struggle, confidence, source }]
══════════════════════════════════════════════════════ */
function computeRuleBasedPredictions(topics, scoreMap) {
  // scoreMap: { "Topic Title": score (0-100) }
  // Only predict for unattempted topics (score === undefined)

  const priorScores = [];
  const predictions = [];

  topics.forEach((topic, position) => {
    const score = scoreMap[topic.title];

    if (score !== undefined) {
      // Topic already attempted — add to prior history
      priorScores.push(score);
      return;
    }

    // Only predict if student has some history
    if (priorScores.length === 0) return;

    // ── Feature 1: prerequisite scores ──
    const prereqScores = (topic.prerequisites || [])
      .map(prereqTitle => scoreMap[prereqTitle])
      .filter(s => s !== undefined);

    const prereqAvg = prereqScores.length > 0
      ? prereqScores.reduce((a, b) => a + b, 0) / prereqScores.length
      : null;

    const prereqMin = prereqScores.length > 0
      ? Math.min(...prereqScores)
      : null;

    // ── Feature 2: prior struggle rate ──
    const priorStruggleRate = priorScores.length > 0
      ? priorScores.filter(s => s < 40).length / priorScores.length
      : 0;

    // ── Feature 3: position penalty ──
    const positionPenalty = position >= 7;

    // ── Rule-based risk scoring ──
    let riskScore = 0;
    let reasons   = [];

    // Weak prerequisites are the strongest signal
    if (prereqMin !== null && prereqMin < 40) {
      riskScore += 0.45;
      reasons.push(`prerequisite score ${Math.round(prereqMin)}%`);
    } else if (prereqMin !== null && prereqMin < 60) {
      riskScore += 0.20;
      reasons.push(`moderate prerequisite score`);
    }

    if (prereqAvg !== null && prereqAvg < 50) {
      riskScore += 0.20;
    }

    // Past struggle pattern
    if (priorStruggleRate >= 0.5) {
      riskScore += 0.30;
      reasons.push(`struggled in ${Math.round(priorStruggleRate * 100)}% of prior topics`);
    } else if (priorStruggleRate >= 0.3) {
      riskScore += 0.15;
    }

    // Late-sequence topics are harder
    if (positionPenalty && riskScore > 0) {
      riskScore += 0.05;
    }

    // Cap at 0.95
    riskScore = Math.min(0.95, riskScore);

    if (riskScore >= 0.40) {
      predictions.push({
        title:        topic.title,
        will_struggle: true,
        confidence:   Math.round(riskScore * 1000) / 1000,
        source:       "rule-based",
        reasons,
      });
    }
  });

  return predictions;
}


/* ══════════════════════════════════════════════════════
   SOCRATIC TUTOR PANEL
══════════════════════════════════════════════════════ */
function SocraticTutorPanel({ topic, subjectName, score, onClose }) {
  const [step, setStep]                   = useState("idle");
  const [tutorMsg, setTutorMsg]           = useState("");
  const [userReply, setUserReply]         = useState("");
  const [followUp, setFollowUp]           = useState("");
  const [followLoading, setFollowLoading] = useState(false);

  const startSession = async () => {
    setStep("loading");
    try {
      const res = await axios.post(`${BASE_URL}/api/ai/socratic`,
        { topic: topic.title, subject: subjectName, score, mode: "topic_review" },
        { headers: authHeader() });
      setTutorMsg(res.data.tutorQuestion); setStep("question");
    } catch { setTutorMsg("Tutor unavailable. Try reviewing the theory."); setStep("question"); }
  };

  const handleFollowUp = async () => {
    if (!userReply.trim()) return;
    setFollowLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/ai/socratic`,
        { topic: topic.title, subject: subjectName, score, mode: "follow_up",
          context: `Tutor: "${tutorMsg}". Student: "${userReply}".` },
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
          <p style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "14px" }}>
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
              <textarea rows={3} placeholder="Type your thinking..." value={userReply}
                onChange={e => setUserReply(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "14px", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", color: "var(--text-primary)", background: "var(--bg-input)" }} />
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button onClick={handleFollowUp} disabled={followLoading || !userReply.trim()}
                  style={{ background: "#7c3aed", color: "white", border: "none", padding: "8px 18px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                  {followLoading ? "Thinking..." : "Submit"}
                </button>
                <button onClick={() => setStep("reveal")}
                  style={{ background: "none", border: "1px solid var(--border-color)", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
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


/* ══════════════════════════════════════════════════════
   ML PREDICTION BANNER
   source: "rule-based" → shows rule badge + ML upgrading indicator
   source: "ml"         → shows ML badge (upgraded)
══════════════════════════════════════════════════════ */
function MLPredictionBanner({ predictions, mlUpgrading }) {
  const [expanded, setExpanded] = useState(false);
  const atRisk = predictions.filter(p => p.will_struggle);

  if (atRisk.length === 0) return null;

  const isRuleBased = atRisk.some(p => p.source === "rule-based");

  return (
    <div style={{ background: "var(--bg-secondary)", border: "1.5px solid #fde68a", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Source badge */}
          {isRuleBased ? (
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: "#fef3c7", color: "#92400e" }}>
              📐 Rule-based
            </span>
          ) : (
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: "#ede9fe", color: "#5b21b6" }}>
              🤖 ML Model
            </span>
          )}
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
            {atRisk.length} upcoming topic{atRisk.length > 1 ? "s" : ""} flagged as high-risk
          </p>
        </div>
        <button onClick={() => setExpanded(v => !v)}
          style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "20px", border: "1px solid #fde68a", background: "var(--bg-card)", color: "#92400e", cursor: "pointer", flexShrink: 0 }}>
          {expanded ? "Show less ▲" : "See topics ▼"}
        </button>
      </div>

      {/* Description */}
      <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        {isRuleBased
          ? "Based on your prerequisite scores and past performance pattern."
          : "Predicted by a Random Forest classifier trained on student performance data."}
      </p>

      {/* ML upgrading indicator */}
      {isRuleBased && mlUpgrading && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
          <div style={{ width: "10px", height: "10px", border: "2px solid var(--border-color)", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
          <span style={{ fontSize: "11px", color: "#8b5cf6", fontStyle: "italic" }}>
            ML model waking up — will upgrade predictions automatically...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Topic list */}
      {expanded && (
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {atRisk.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "0.5px solid var(--border-color)" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>{p.title}</span>
                {/* Show reasons for rule-based */}
                {p.reasons?.length > 0 && (
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
                    Reason: {p.reasons[0]}
                  </p>
                )}
              </div>
              <div style={{ width: "80px", height: "5px", background: "#fde68a", borderRadius: "3px", overflow: "hidden", flexShrink: 0 }}>
                <div style={{ height: "100%", width: `${Math.round(p.confidence * 100)}%`, background: "#f59e0b" }} />
              </div>
              <span style={{ fontSize: "11px", color: "#92400e", fontWeight: 600, flexShrink: 0, minWidth: "42px", textAlign: "right" }}>
                {Math.round(p.confidence * 100)}% risk
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ══════════════════════════════════════════════════════
   MAIN SUBJECT PAGE
══════════════════════════════════════════════════════ */
function SubjectPage() {
  const { subjectName } = useParams();
  const navigate        = useNavigate();
  const subject         = subjectsData[subjectName];

  const [progressData,   setProgressData]   = useState([]);
  const [activeTutorKey, setActiveTutorKey] = useState(null);
  const [predictions,    setPredictions]    = useState([]);
  const [mlUpgrading,    setMlUpgrading]    = useState(false);

  const mlAbortRef = useRef(null);

  const fetchProgress = useCallback(() => {
    axios.get(`${BASE_URL}/api/analytics`, { headers: authHeader() })
      .then(res => {
        const topicList = res.data.topics?.[subjectName] || [];
        setProgressData(topicList);

        if (topicList.length === 0 || !subject) return;

        // 1. Map scores from DB (slugified) to their respective values
        const scoreBySlug = {};
        topicList.forEach(t => { 
          scoreBySlug[slugify(t.topic)] = t.score; 
        });

        // 2. Build title-keyed score map for the Rule Engine
        // IMPORTANT: The Rule Engine uses .title to check prerequisites
        const scoreByTitle = {};
        subject.topics.forEach(t => {
          const score = scoreBySlug[t.key];
          if (score !== undefined && score > 0) {
            scoreByTitle[t.title] = score;
          }
        });

        // 3. STEP 1: Run Rule-based predictions INSTANTLY
        const rulePreds = computeRuleBasedPredictions(subject.topics, scoreByTitle);
        setPredictions(rulePreds);

        // 4. STEP 2: ML predictions — runs in background
        setMlUpgrading(true);
        if (mlAbortRef.current) mlAbortRef.current.abort();
        mlAbortRef.current = new AbortController();

        // Send simple slugified topic scores to the Flask ML Service
        const mlPayload = {};
        topicList.forEach(t => { mlPayload[slugify(t.topic)] = t.score; });

        axios.post(
          `${BASE_URL}/api/ml/predict-struggle`,
          { subject: subjectName, topicScores: mlPayload },
          { headers: authHeader(), signal: mlAbortRef.current.signal, timeout: 45000 }
        )
          .then(mlRes => {
            const mlPreds = mlRes.data.predictions || [];
            if (mlPreds.length > 0) {
              // ML responded — smoothly replace rule-based predictions
              const tagged = mlPreds.map(p => ({ ...p, source: "ml" }));
              setPredictions(tagged);
            }
          })
          .catch(err => {
            if (axios.isCancel(err)) return;
            console.log("ML background fetch failed/timeout, keeping rule-based results.");
          })
          .finally(() => setMlUpgrading(false));
      })
      .catch(err => console.log("Analytics error:", err));
  }, [subjectName, subject])

  useEffect(() => {
    fetchProgress();
    return () => { if (mlAbortRef.current) mlAbortRef.current.abort(); };
  }, [fetchProgress]);

  useEffect(() => {
    window.addEventListener("focus", fetchProgress);
    return () => window.removeEventListener("focus", fetchProgress);
  }, [fetchProgress]);

  if (!subject) return <h2 style={{ color: "var(--text-primary)" }}>Subject Not Found</h2>;

  const getScore      = (k) => { const t = progressData.find(t => slugify(t.topic) === k); return t ? t.score : 0; };
  const getScoreColor = (s) => s >= 70 ? "#16a34a" : s >= 40 ? "#d97706" : s > 0 ? "#dc2626" : "var(--text-muted)";
  const getScoreLabel = (s) => s === 0 ? null : s >= 70 ? "Strong" : s >= 40 ? "Moderate" : "Needs work";

  const predByTitle = {};
  predictions.forEach(p => { predByTitle[p.title] = p; });

  const attempted = subject.topics.filter(t => getScore(t.key) > 0).length;
  const strong    = subject.topics.filter(t => getScore(t.key) >= 70).length;
  const weak      = subject.topics.filter(t => getScore(t.key) > 0 && getScore(t.key) < 40).length;
  const avgScore  = attempted === 0 ? 0
    : Math.round(subject.topics.filter(t => getScore(t.key) > 0).reduce((s, t) => s + getScore(t.key), 0) / attempted);
  const nextTopic = subject.topics.find(t => getScore(t.key) === 0)
    || subject.topics.find(t => getScore(t.key) > 0 && getScore(t.key) < 40)
    || null;

  return (
    <div style={{ padding: "40px", maxWidth: "860px", margin: "0 auto" }}>

      {/* Header */}
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

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Avg score",  value: `${avgScore}%` },
          { label: "Attempted",  value: `${attempted}/${subject.topics.length}` },
          { label: "Strong",     value: strong },
          { label: "Weak",       value: weak   },
        ].map((s, i) => (
          <div key={i} style={{ background: "var(--bg-card)", borderRadius: "10px", padding: "14px 16px", boxShadow: "var(--shadow-sm)", textAlign: "center", border: "1px solid var(--border-color)" }}>
            <p style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Prediction banner — shows rule-based instantly, upgrades to ML silently */}
      {attempted > 0 && (
        <MLPredictionBanner predictions={predictions} mlUpgrading={mlUpgrading} />
      )}

      {/* Recommendation */}
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
        const pred       = predByTitle[topic.title];
        const isAtRisk   = pred?.will_struggle && score === 0;
        const isML       = pred?.source === "ml";

        return (
          <div key={index} style={{ background: "var(--bg-card)", borderRadius: "10px", padding: "14px 16px", marginBottom: "10px", boxShadow: "var(--shadow-sm)", border: isAtRisk ? "1.5px solid #fde68a" : "1px solid var(--border-color)" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>{topic.title}</span>

                {isAtRisk && (
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: "#fef3c7", color: "#92400e",
                    border: "1px solid #fde68a" }}
                    title={isML ? "Predicted by ML model" : "Predicted by rule-based engine"}>
                    {isML ? "🤖 At Risk" : "📐 At Risk"}
                  </span>
                )}

                {score > 0 && (
                  <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "20px", border: `1px solid ${scoreColor}`, color: scoreColor, fontWeight: 500 }}>
                    {score}% · {label}
                  </span>
                )}
                {score === 0 && !isAtRisk && (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>Not started</span>
                )}
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

            {isAtRisk && pred && (
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#92400e" }}>
                  {isML ? "ML risk:" : "Rule risk:"}
                </span>
                <div style={{ flex: 1, height: "4px", background: "#fde68a", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round(pred.confidence * 100)}%`, background: "#f59e0b" }} />
                </div>
                <span style={{ fontSize: "11px", color: "#92400e", fontWeight: 600 }}>
                  {Math.round(pred.confidence * 100)}%
                </span>
              </div>
            )}

            {tutorOpen && (
              <SocraticTutorPanel topic={topic} subjectName={subjectName} score={score} onClose={() => setActiveTutorKey(null)} />
            )}
          </div>
        );
      })}

    </div>
  );
}

export default SubjectPage;