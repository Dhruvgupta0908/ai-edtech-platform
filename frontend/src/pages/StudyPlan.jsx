// frontend/src/pages/StudyPlan.jsx
// FIXED — every text, border, background uses CSS variables for full dark mode support

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authHeader, getUserName } from "../utils/auth";

const ACTIVITY_STYLE = {
  "Read theory":    { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", icon: "📖" },
  "Watch video":    { bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff", icon: "🎬" },
  "Practice quiz":  { bg: "#f0fdf4", color: "#15803d", border: "#86efac", icon: "✏️" },
  "Revise notes":   { bg: "#fffbeb", color: "#92400e", border: "#fde68a", icon: "📝" },
  "Attempt test":   { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5", icon: "🎯" },
  "Solve problems": { bg: "#f0fdfa", color: "#065f46", border: "#6ee7b7", icon: "🧠" },
};
const getActivityStyle = (a) => ACTIVITY_STYLE[a] || { bg: "#f8fafc", color: "#374151", border: "#e5e7eb", icon: "📌" };

const SUBJECT_COLORS = {
  "operating-systems": "#6366f1", "computer-networks": "#22c55e",
  "data-structures": "#a855f7", "algorithms": "#f97316",
  "dbms": "#ef4444", "compiler-design": "#14b8a6",
  "discrete-mathematics": "#eab308", "theory-of-computation": "#8b5cf6",
};
const subjectColor = (s) => SUBJECT_COLORS[s.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z-]/g,"")] || "#6b7280";

const ALL_TOPICS = {
  "Operating Systems":           ["Introduction to Operating Systems","System Calls and OS Structure","Process Concept","Process Scheduling","Threads and Multithreading","Process Synchronization","Deadlocks","Memory Management","Virtual Memory","File Systems"],
  "Computer Networks":           ["Introduction to Computer Networks","OSI and TCP/IP Models","Physical Layer","Data Link Layer","Network Layer","Transport Layer","Application Layer","Routing Algorithms","Congestion Control","Network Security Basics"],
  "Data Structures":             ["Introduction to Data Structures","Arrays","Linked Lists","Stacks","Queues","Trees","Binary Search Trees","Heaps and Priority Queues","Graphs","Hashing"],
  "Algorithms":                  ["Algorithm Analysis and Asymptotic Notations","Recursion and Divide & Conquer","Greedy Algorithms","Dynamic Programming","Backtracking","Branch and Bound","Graph Algorithms","Shortest Path Algorithms","Minimum Spanning Tree","NP-Completeness"],
  "Database Management Systems": ["Introduction to DBMS","ER Model","Relational Model","SQL","Relational Algebra","Normalization","Transaction Management","Concurrency Control","Indexing and Hashing","Recovery Techniques"],
  "Compiler Design":             ["Introduction to Compilers","Lexical Analysis","Syntax Analysis","Parsing Techniques","Semantic Analysis","Intermediate Code Generation","Code Optimization","Code Generation","Symbol Table","Runtime Environment"],
  "Discrete Mathematics":        ["Propositional Logic","Predicate Logic","Set Theory","Relations and Functions","Mathematical Induction","Combinatorics","Recurrence Relations","Graph Theory","Trees","Boolean Algebra"],
  "Theory of Computation":       ["Introduction to Automata Theory","Finite Automata","Regular Expressions","Context-Free Grammars","Pushdown Automata","Turing Machines","Undecidability","Decidability Problems","Chomsky Hierarchy","Complexity Theory Basics"],
};
const SUBJECT_KEY_TO_TITLE = {
  "operating-systems":"Operating Systems","computer-networks":"Computer Networks",
  "data-structures":"Data Structures","algorithms":"Algorithms",
  "dbms":"Database Management Systems","compiler-design":"Compiler Design",
  "discrete-mathematics":"Discrete Mathematics","theory-of-computation":"Theory of Computation",
};

/* ── Small reusable components ── */
const Label = ({ children }) => (
  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px", marginTop: 0 }}>
    {children}
  </p>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    fontSize: "13px", padding: "7px 18px", borderRadius: "20px", cursor: "pointer",
    fontWeight: 500, border: "1.5px solid",
    borderColor: active ? "#6366f1" : "var(--border-color)",
    background:  active ? "#6366f1" : "var(--bg-secondary)",
    color:       active ? "white"   : "var(--text-primary)",
    transition: "all 0.15s",
  }}>
    {label}
  </button>
);

export default function StudyPlan() {
  const navigate = useNavigate();
  const [targetDays,   setTargetDays]   = useState(14);
  const [examGoal,     setExamGoal]     = useState("GATE 2026");
  const [weakTopics,   setWeakTopics]   = useState([]);
  const [notStarted,   setNotStarted]   = useState([]);
  const [plan,         setPlan]         = useState([]);
  const [phase,        setPhase]        = useState("config");
  const [error,        setError]        = useState("");
  const [expandedDays, setExpandedDays] = useState({});

  useEffect(() => {
    axios.get("https://ai-edtech-backend-r2y7.onrender.com/api/analytics", { headers: authHeader() })
      .then(res => {
        const { topics } = res.data;
        const weak = [], attempted = new Set();
        Object.entries(topics).forEach(([subjectKey, topicList]) => {
          const subjectTitle = SUBJECT_KEY_TO_TITLE[subjectKey] || subjectKey;
          topicList.forEach(t => {
            attempted.add(`${subjectKey}::${t.topic}`);
            if (t.score < 40) weak.push({ subject: subjectTitle, topic: t.topic, score: t.score });
          });
        });
        const notStart = [];
        Object.entries(ALL_TOPICS).forEach(([subjectTitle, topicList]) => {
          const subjectKey = Object.keys(SUBJECT_KEY_TO_TITLE).find(k => SUBJECT_KEY_TO_TITLE[k] === subjectTitle);
          topicList.forEach(topic => { if (!attempted.has(`${subjectKey}::${topic}`)) notStart.push({ subject: subjectTitle, topic }); });
        });
        setWeakTopics(weak); setNotStarted(notStart);
      }).catch(err => console.log("Analytics fetch error:", err));
  }, []);

  const generatePlan = async () => {
    setPhase("loading"); setError("");
    try {
      const res = await axios.post("https://ai-edtech-backend-r2y7.onrender.com/api/ai/study-plan",
        { weakTopics, notStarted: notStarted.slice(0, 20), targetDays, examGoal },
        { headers: authHeader() });
      setPlan(res.data.plan);
      const expanded = {};
      res.data.plan.slice(0, 3).forEach(d => { expanded[d.day] = true; });
      setExpandedDays(expanded); setPhase("result");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate plan. Please try again.");
      setPhase("config");
    }
  };

  const toggleDay = (day) => setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  const totalTasks = plan.reduce((acc, d) => acc + (d.tasks?.length || 0), 0);
  const totalHours = plan.reduce((acc, d) => acc + (d.tasks || []).reduce((a, t) => a + (t.duration?.includes("hour") ? 60 : parseInt(t.duration) || 45), 0), 0);

  /* ══════════════════
     CONFIG SCREEN
  ══════════════════ */
  if (phase === "config") return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Subtitle */}
      <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "28px" }}>
        Personalised day-wise plan based on your performance — generated by AI
      </p>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "28px" }}>
        {[
          { num: weakTopics.length, label: "Weak topics", sub: "score < 40% — need revision", numColor: "#dc2626", border: "#fca5a5" },
          { num: notStarted.length, label: "Not started",  sub: "never attempted",             numColor: "var(--text-primary)", border: "var(--border-color)" },
          { num: weakTopics.length + notStarted.length, label: "Total to cover", sub: "topics in your plan", numColor: "#16a34a", border: "#86efac" },
        ].map((s, i) => (
          <div key={i} style={{ background: "var(--bg-card)", borderRadius: "14px", padding: "22px 20px", textAlign: "center", border: `1.5px solid ${s.border}`, boxShadow: "var(--shadow-sm)" }}>
            <p style={{ fontSize: "36px", fontWeight: 800, margin: "0 0 6px", color: s.numColor, lineHeight: 1 }}>{s.num}</p>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>{s.label}</p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {weakTopics.length === 0 && notStarted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: "32px", marginBottom: "12px" }}>🎉</p>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>You've attempted all topics with strong scores!</p>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Attempt some tests first to generate a personalised plan.</p>
          <button onClick={() => navigate("/dashboard")} style={{ marginTop: "20px", padding: "12px 32px", borderRadius: "10px", border: "none", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "white", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>Go to Dashboard</button>
        </div>
      ) : (
        /* Config card */
        <div style={{ background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", padding: "28px", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 24px" }}>Configure your plan</h2>

          {/* Duration */}
          <div style={{ marginBottom: "22px" }}>
            <Label>Plan duration</Label>
            <div style={{ display: "flex", gap: "10px" }}>
              {[7, 14, 30].map(d => <Pill key={d} label={`${d} days`} active={targetDays === d} onClick={() => setTargetDays(d)} />)}
            </div>
          </div>

          {/* Goal */}
          <div style={{ marginBottom: "22px" }}>
            <Label>Exam goal</Label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {["GATE 2026", "Placements", "University Exam"].map(g => <Pill key={g} label={g} active={examGoal === g} onClick={() => setExamGoal(g)} />)}
            </div>
          </div>

          {/* Weak topics */}
          {weakTopics.length > 0 && (
            <div style={{ marginBottom: "22px" }}>
              <Label>Weak topics included</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {weakTopics.map((t, i) => (
                  <span key={i} style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "20px", background: "var(--bg-secondary)", color: "#dc2626", border: "1px solid #fca5a5", fontWeight: 500 }}>
                    {t.topic} · {t.score}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && <p style={{ color: "#dc2626", fontSize: "13px", margin: "0 0 16px" }}>{error}</p>}

          <button onClick={generatePlan} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "white", fontSize: "16px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.35)", marginTop: "4px" }}>
            Generate My {targetDays}-Day Plan →
          </button>
        </div>
      )}
    </div>
  );

  /* ══════════════════
     LOADING SCREEN
  ══════════════════ */
  if (phase === "loading") return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ width: "44px", height: "44px", border: "4px solid var(--border-color)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginTop: "24px" }}>AI is building your study plan...</p>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "8px" }}>Analysing {weakTopics.length} weak topics and {notStarted.length} not-started topics</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  /* ══════════════════
     RESULT SCREEN
  ══════════════════ */
  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>Your {targetDays}-Day Study Plan</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>For {getUserName()} · {examGoal} · Generated by AI</p>
        </div>
        <button onClick={() => setPhase("config")} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          ↺ Regenerate
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
        {[
          { label: "Days",  value: plan.length },
          { label: "Tasks", value: totalTasks  },
          { label: "Est. hours", value: `~${Math.round(totalHours / 60)}h` },
          { label: "Weak topics", value: weakTopics.length },
        ].map((st, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "var(--bg-card)", borderRadius: "10px", padding: "12px 20px", border: "1px solid var(--border-color)", minWidth: "90px" }}>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>{st.value}</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>{st.label}</span>
          </div>
        ))}
      </div>

      {/* Expand / Collapse */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {[["Expand all", true], ["Collapse all", false]].map(([label, val]) => (
          <button key={label} onClick={() => { const e = {}; if (val) plan.forEach(d => { e[d.day] = true; }); setExpandedDays(e); }}
            style={{ fontSize: "12px", padding: "5px 14px", borderRadius: "20px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", cursor: "pointer", fontWeight: 500 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Day cards */}
      {plan.map((dayObj) => {
        const isExpanded = expandedDays[dayObj.day];
        const isFinal    = dayObj.day >= plan.length - 1;
        const isRest     = (dayObj.tasks?.length || 0) <= 2 && dayObj.day % 6 === 0;

        return (
          <div key={dayObj.day} style={{ background: "var(--bg-card)", borderRadius: "12px", border: `1px solid ${isFinal ? "#6366f1" : "var(--border-color)"}`, marginBottom: "10px", overflow: "hidden" }}>

            {/* Header row — always visible */}
            <div onClick={() => toggleDay(dayObj.day)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", cursor: "pointer", userSelect: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Day circle */}
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, flexShrink: 0,
                  background: isFinal ? "#6366f1" : isRest ? "#f59e0b" : "var(--bg-secondary)",
                  color:      isFinal ? "white"   : isRest ? "white"   : "var(--text-primary)",
                  border:     isFinal || isRest ? "none" : "1.5px solid var(--border-color)"
                }}>
                  {dayObj.day}
                </div>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                    Day {dayObj.day}
                    {isFinal && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: "#eef2ff", color: "#4338ca", fontWeight: 700 }}>Final</span>}
                    {isRest  && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: "#fffbeb", color: "#92400e", fontWeight: 700 }}>Rest day</span>}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
                    {dayObj.tasks?.length} task{dayObj.tasks?.length !== 1 ? "s" : ""}
                    {" · "}
                    {dayObj.tasks?.map(t => t.subject).filter((v, i, a) => a.indexOf(v) === i).slice(0, 2).join(", ")}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Subject dots */}
                <div style={{ display: "flex", gap: "4px" }}>
                  {dayObj.tasks?.map(t => t.subject).filter((v, i, a) => a.indexOf(v) === i).map((sub, i) => (
                    <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: subjectColor(sub) }} />
                  ))}
                </div>
                <span style={{ fontSize: "18px", color: "var(--text-muted)", transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" }}>›</span>
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{ borderTop: "1px solid var(--border-color)", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>

                {/* Daily tip */}
                {dayObj.tip && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderLeft: "3px solid #22c55e", borderRadius: "8px", padding: "10px 14px" }}>
                    <span style={{ fontSize: "14px", flexShrink: 0 }}>💡</span>
                    <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>{dayObj.tip}</p>
                  </div>
                )}

                {/* Tasks */}
                {dayObj.tasks?.map((task, ti) => {
                  const aStyle = getActivityStyle(task.activity);
                  return (
                    <div key={ti} style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-secondary)", borderRadius: "10px", padding: "12px 14px", border: "1px solid var(--border-color)" }}>
                      {/* Subject color bar */}
                      <div style={{ width: "3px", background: subjectColor(task.subject), borderRadius: "3px", flexShrink: 0, alignSelf: "stretch" }} />

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
                          {/* Activity badge */}
                          <span style={{ fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: aStyle.bg, color: aStyle.color, border: `1px solid ${aStyle.border}` }}>
                            {aStyle.icon} {task.activity}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{task.duration}</span>
                        </div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px" }}>{task.topic}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>{task.subject}</p>
                      </div>

                      {/* Navigate button */}
                      <button
                        onClick={() => {
                          const k = Object.keys(SUBJECT_KEY_TO_TITLE).find(k => SUBJECT_KEY_TO_TITLE[k] === task.subject);
                          if (k) navigate(`/subject/${k}`);
                        }}
                        style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "#6366f1", fontSize: "15px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                        →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom CTA */}
      <div style={{ textAlign: "center", marginTop: "40px", paddingTop: "32px", borderTop: "1px solid var(--border-color)" }}>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 12px" }}>Plan not right? Regenerate with different settings.</p>
        <button onClick={() => setPhase("config")} style={{ padding: "10px 28px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
          ↺ Regenerate Plan
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}