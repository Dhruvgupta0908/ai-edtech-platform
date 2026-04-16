// frontend/src/pages/Topicpage.jsx
// FULLY FIXED — every hardcoded color replaced with CSS variables for dark mode

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { authHeader } from "../utils/auth";

/* ══════════════════════════════════════════════════════
   ExplainBox
══════════════════════════════════════════════════════ */
const ExplainBox = ({ topic, subject, ans }) => {
  const [status,      setStatus]      = useState("idle");
  const [explanation, setExplanation] = useState("");

  const fetchExplanation = async () => {
    setStatus("loading");
    try {
      const res = await axios.post("http://localhost:5000/api/ai/explain-mistake", {
        topic, subject,
        question:      ans.question,
        chosenOption:  ans.options[ans.chosenIndex],
        correctOption: ans.options[ans.correctIndex],
        allOptions:    ans.options
      }, { headers: authHeader() });
      setExplanation(res.data.explanation || "No explanation returned.");
      setStatus("done");
    } catch {
      setExplanation("Could not load explanation. Please try again.");
      setStatus("error");
    }
  };

  if (status === "idle") return (
    <button onClick={fetchExplanation} style={s.explainBtn}>🤖 Why was I wrong?</button>
  );

  if (status === "loading") return (
    <div style={s.explainBox}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={s.spinner} />
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>AI is analysing your mistake...</span>
      </div>
    </div>
  );

  return (
    <div style={s.explainBox}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#4c1d95" }}>🤖 AI Explanation</span>
        <button onClick={() => setStatus("idle")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "var(--text-muted)" }}>✕</button>
      </div>
      <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.7 }}>
        <ReactMarkdown>{explanation}</ReactMarkdown>
      </div>
    </div>
  );
};


/* ══════════════════════════════════════════════════════
   Option Row — shared by quiz, practice, report
══════════════════════════════════════════════════════ */
const OptionRow = ({ opt, i, isSelected, onClick, accentColor = "#6366f1" }) => (
  <div onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: "14px",
    padding: "14px 18px", borderRadius: "10px", cursor: onClick ? "pointer" : "default",
    border: isSelected ? `2px solid ${accentColor}` : "1.5px solid var(--border-color)",
    background: isSelected ? "var(--bg-hover)" : "var(--bg-card)",
    transition: "all 0.15s",
  }}>
    <span style={{
      width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "13px", fontWeight: 700,
      background: isSelected ? accentColor : "var(--bg-secondary)",
      color: isSelected ? "white" : "var(--text-secondary)",
      transition: "all 0.15s"
    }}>
      {String.fromCharCode(65 + i)}
    </span>
    <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: isSelected ? 500 : 400 }}>
      {opt}
    </span>
  </div>
);


/* ══════════════════════════════════════════════════════
   ReportOptionRow — for results view (correct/wrong coloring)
══════════════════════════════════════════════════════ */
const ReportOptionRow = ({ opt, j, isCorrect, isWrongChosen }) => {
  // Use border-left accent + neutral background so text is always readable
  // in both light and dark mode. Colored backgrounds cause contrast issues in dark mode.
  let borderLeft = "3px solid var(--border-color)";
  let bg         = "var(--bg-secondary)";
  let textColor  = "var(--text-primary)";
  let circleBg   = "var(--bg-hover)";
  let circleColor= "var(--text-muted)";
  let labelColor = "var(--text-muted)";
  let labelText  = "";

  if (isCorrect) {
    borderLeft  = "3px solid #22c55e";
    bg          = "var(--bg-secondary)";
    textColor   = "#16a34a";
    circleBg    = "#22c55e";
    circleColor = "white";
    labelColor  = "#16a34a";
    labelText   = "✓ Correct";
  }
  if (isWrongChosen) {
    borderLeft  = "3px solid #ef4444";
    bg          = "var(--bg-secondary)";
    textColor   = "#dc2626";
    circleBg    = "#ef4444";
    circleColor = "white";
    labelColor  = "#dc2626";
    labelText   = "Your answer";
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "9px 12px", borderRadius: "8px", marginBottom: "6px",
      fontSize: "13px", background: bg,
      border: "1px solid var(--border-color)",
      borderLeft,
    }}>
      <span style={{
        width: "22px", height: "22px", borderRadius: "50%",
        background: circleBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "11px", fontWeight: 700, flexShrink: 0, color: circleColor
      }}>
        {String.fromCharCode(65 + j)}
      </span>
      <span style={{ flex: 1, color: textColor, fontWeight: (isCorrect || isWrongChosen) ? 600 : 400 }}>{opt}</span>
      {labelText && (
        <span style={{ fontSize: "11px", fontWeight: 700, color: labelColor, flexShrink: 0 }}>{labelText}</span>
      )}
    </div>
  );
};


/* ══════════════════════════════════════════════════════
   GeneratePractice
══════════════════════════════════════════════════════ */
const GeneratePractice = ({ topicData, subjectName, existingQuestions }) => {
  const [phase,          setPhase]          = useState("idle");
  const [aiQuestions,    setAiQuestions]    = useState([]);
  const [currentIndex,   setCurrentIndex]   = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers,        setAnswers]        = useState([]);
  const [error,          setError]          = useState("");

  const generate = async () => {
    setPhase("loading"); setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/ai/generate-questions", {
        topic: topicData.title, subject: subjectName,
        theory: topicData.theory,
        existingQs: existingQuestions.map(q => q.question), count: 5
      }, { headers: authHeader() });
      setAiQuestions(res.data.questions);
      setCurrentIndex(0); setSelectedOption(null); setAnswers([]);
      setPhase("question");
    } catch { setError("Could not generate questions. Please try again."); setPhase("idle"); }
  };

  const handleAnswer = () => {
    if (selectedOption === null) return;
    const q = aiQuestions[currentIndex];
    const isCorrect = selectedOption === q.correctAnswer;
    const record = { question: q.question, options: q.options, correctIndex: q.correctAnswer, chosenIndex: selectedOption, isCorrect };
    const updated = [...answers, record];
    setAnswers(updated);
    setSelectedOption(null);
    if (currentIndex + 1 >= aiQuestions.length) setPhase("results");
    else setCurrentIndex(i => i + 1);
  };

  const correctCount = answers.filter(a => a.isCorrect).length;
  const pct = aiQuestions.length ? Math.round((correctCount / aiQuestions.length) * 100) : 0;
  const pctColor = pct >= 70 ? "#16a34a" : pct >= 40 ? "#d97706" : "#dc2626";

  return (
    <div style={s.genWrap}>
      {phase === "idle" && (
        <div style={s.genIdle}>
          <div>
            <p style={s.genTitle}>✨ Want more practice?</p>
            <p style={s.genSub}>Generate 5 fresh AI-created questions on this topic — different every time.</p>
            {error && <p style={{ color: "#dc2626", fontSize: "13px", margin: "4px 0 0" }}>{error}</p>}
          </div>
          <button onClick={generate} style={s.genBtn}>Generate Questions →</button>
        </div>
      )}

      {phase === "loading" && (
        <div style={{ ...s.genIdle, justifyContent: "center", gap: "14px" }}>
          <div style={s.spinner} />
          <div>
            <p style={s.genTitle}>AI is crafting questions...</p>
            <p style={s.genSub}>Generating 5 unique questions tailored to this topic.</p>
          </div>
        </div>
      )}

      {phase === "question" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={s.aiBadge}>✨ AI Generated</span>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Question {currentIndex + 1} of {aiQuestions.length}</span>
            </div>
            <button onClick={() => setPhase("idle")} style={s.genCloseBtn}>✕ Cancel</button>
          </div>
          <div style={{ height: "4px", background: "var(--border-color)", borderRadius: "4px", overflow: "hidden", marginBottom: "20px" }}>
            <div style={{ height: "100%", width: `${(currentIndex / aiQuestions.length) * 100}%`, background: "linear-gradient(90deg,#8b5cf6,#6366f1)", borderRadius: "4px", transition: "width 0.3s" }} />
          </div>
          <div style={{ ...s.questionBox, background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
            <span style={{ ...s.questionNum, background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}>Q{currentIndex + 1}</span>
            <h3 style={s.questionText}>{aiQuestions[currentIndex].question}</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {aiQuestions[currentIndex].options.map((opt, i) => (
              <OptionRow key={i} opt={opt} i={i} isSelected={selectedOption === i} onClick={() => setSelectedOption(i)} accentColor="#8b5cf6" />
            ))}
          </div>
          <button onClick={handleAnswer} disabled={selectedOption === null} style={{
            width: "100%", padding: "14px", borderRadius: "10px", border: "none",
            background: selectedOption === null ? "var(--bg-secondary)" : "linear-gradient(90deg,#8b5cf6,#6366f1)",
            color: selectedOption === null ? "var(--text-muted)" : "white",
            fontSize: "15px", fontWeight: 600,
            cursor: selectedOption === null ? "not-allowed" : "pointer", transition: "all 0.2s"
          }}>
            {currentIndex + 1 === aiQuestions.length ? "Finish Practice 🎯" : "Next Question →"}
          </button>
        </div>
      )}

      {phase === "results" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ width: "70px", height: "70px", borderRadius: "50%", border: `3px solid ${pctColor}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "20px", fontWeight: 700, color: pctColor, lineHeight: 1 }}>{pct}%</span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{correctCount}/{aiQuestions.length}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                {pct >= 70 ? "🎉 Excellent!" : pct >= 40 ? "📚 Good effort!" : "💪 Keep practising!"}
              </p>
              <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--text-secondary)" }}>AI Practice Round complete</p>
              <button onClick={generate} style={{ ...s.genBtn, padding: "7px 16px", fontSize: "13px" }}>Generate 5 More →</button>
            </div>
          </div>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>Practice Round Breakdown</h4>
          {answers.map((ans, i) => (
            <div key={i} style={{ ...s.reportCard, borderLeft: `4px solid ${ans.isCorrect ? "#22c55e" : "#ef4444"}`, marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: ans.isCorrect ? "#dcfce7" : "#fee2e2", color: ans.isCorrect ? "#166534" : "#991b1b" }}>
                  {ans.isCorrect ? "✓ Correct" : "✗ Wrong"}
                </span>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={s.aiBadge}>AI</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Q{i + 1}</span>
                </div>
              </div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 10px", lineHeight: 1.5 }}>{ans.question}</p>
              {ans.options.map((opt, j) => (
                <ReportOptionRow key={j} opt={opt} j={j}
                  isChosen={j === ans.chosenIndex}
                  isCorrect={j === ans.correctIndex}
                  isWrongChosen={j === ans.chosenIndex && !ans.isCorrect} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


/* ══════════════════════════════════════════════════════
   ResultsView
══════════════════════════════════════════════════════ */
const ResultsView = ({ answers, totalQuestions, topicTitle, subjectName, onRetry, isPrevious = false, topicDataRef = null }) => {
  const correctCount = answers.filter(a => a.isCorrect).length;
  const percentage   = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const scoreColor   = percentage >= 70 ? "#16a34a" : percentage >= 40 ? "#d97706" : "#dc2626";
  const scoreBg      = percentage >= 70 ? "#f0fdf4" : percentage >= 40 ? "#fffbeb" : "#fef2f2";

  return (
    <div>
      {/* Score banner */}
      <div style={{ ...s.scoreBanner, background: scoreBg, borderColor: scoreColor + "33" }}>
        <div style={{ ...s.scoreCircle, borderColor: scoreColor }}>
          <span style={{ fontSize: "26px", fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{percentage}%</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{correctCount}/{totalQuestions}</span>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
            {percentage >= 70 ? "🎉 Excellent work!" : percentage >= 40 ? "📚 Keep going!" : "💪 Don't give up!"}
          </h2>
          <p style={{ margin: "0 0 16px", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.5 }}>
            {percentage >= 70 ? "You have a strong grasp of this topic."
              : percentage >= 40 ? "You know the basics — review the mistakes below."
              : "Study the theory section carefully and try again."}
          </p>
          {!isPrevious && <button onClick={onRetry} style={s.retryBtn}>🔁 Retry Test</button>}
        </div>
      </div>

      {/* Pills */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "28px", flexWrap: "wrap" }}>
        {[
          { label: `✅  ${correctCount} Correct`,                           bg: "#dcfce7", color: "#166534" },
          { label: `❌  ${answers.filter(a => !a.isCorrect).length} Wrong`, bg: "#fee2e2", color: "#991b1b" },
          { label: `📝  ${totalQuestions} Total`,                            bg: "#e0f2fe", color: "#075985" },
        ].map((p, i) => (
          <span key={i} style={{ padding: "6px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: 500, background: p.bg, color: p.color }}>{p.label}</span>
        ))}
      </div>

      {/* Per-question report */}
      <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>Detailed Report</h3>

      {answers.map((ans, i) => (
        <div key={i} style={{ ...s.reportCard, borderLeft: `4px solid ${ans.isCorrect ? "#22c55e" : "#ef4444"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: ans.isCorrect ? "#dcfce7" : "#fee2e2", color: ans.isCorrect ? "#166534" : "#991b1b" }}>
              {ans.isCorrect ? "✓ Correct" : "✗ Wrong"}
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>Q{i + 1}</span>
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 12px", lineHeight: 1.5 }}>{ans.question}</p>
          <div>
            {ans.options.map((opt, j) => (
              <ReportOptionRow key={j} opt={opt} j={j}
                isChosen={j === ans.chosenIndex}
                isCorrect={j === ans.correctIndex}
                isWrongChosen={j === ans.chosenIndex && !ans.isCorrect} />
            ))}
          </div>
          {!ans.isCorrect && !isPrevious && (
            <div style={{ marginTop: "12px" }}>
              <ExplainBox topic={topicTitle} subject={subjectName} ans={ans} />
            </div>
          )}
        </div>
      ))}

      {!isPrevious && (
        <div style={{ marginTop: "32px", borderTop: "1px solid var(--border-color)", paddingTop: "28px" }}>
          <GeneratePractice topicData={topicDataRef} subjectName={subjectName} existingQuestions={answers} />
        </div>
      )}
    </div>
  );
};


/* ══════════════════════════════════════════════════════
   MAIN TOPIC PAGE
══════════════════════════════════════════════════════ */
const TopicPage = () => {
  const { subjectName, topicName } = useParams();

  const [topicData,         setTopicData]         = useState(null);
  const [activeTab,         setActiveTab]         = useState("theory");
  const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);
  const [currentIndex,      setCurrentIndex]      = useState(0);
  const [score,             setScore]             = useState(0);
  const [selectedOption,    setSelectedOption]    = useState(null);
  const [answers,           setAnswers]           = useState([]);
  const [testPhase,         setTestPhase]         = useState("start");
  const [aiQuestion,        setAiQuestion]        = useState("");
  const [aiAnswer,          setAiAnswer]          = useState("");
  const [loadingAI,         setLoadingAI]         = useState(false);
  const [previousAnswers,   setPreviousAnswers]   = useState([]);
  const [showPrevious,      setShowPrevious]      = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/topics/${subjectName}/${topicName}`)
      .then(res => setTopicData(res.data))
      .catch(err => console.log(err));
  }, [subjectName, topicName]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (topicData?.questions) setAdaptiveQuestions(topicData.questions);
  }, [topicData]);

  useEffect(() => {
    const fetchLastAttempt = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/progress/${subjectName}/${topicName}`,
          { headers: authHeader() }
        );
        if (res.data.found && res.data.lastAttempt?.length > 0) {
          setPreviousAnswers(res.data.lastAttempt);
          setTestPhase("start");
        }
      } catch (err) { console.log("No previous attempt:", err.message); }
    };
    fetchLastAttempt();
  }, [subjectName, topicName]);

  const resetTest = () => {
    setCurrentIndex(0); setScore(0); setSelectedOption(null);
    setAnswers([]); setShowPrevious(false); setTestPhase("start");
  };

  const updateProgress = async (section, scoreValue, answersToSave) => {
    try {
      await axios.post("http://localhost:5000/api/progress",
        { subject: subjectName, topic: topicName, section, score: scoreValue, answers: answersToSave },
        { headers: authHeader() });
    } catch (err) { console.log("Progress save error:", err); }
    try {
      await axios.post("http://localhost:5000/api/streak", {}, { headers: authHeader() });
    } catch (err) { console.log("Streak update error:", err); }
  };

  const handleAdaptiveAnswer = () => {
    if (selectedOption === null) return;
    const q = adaptiveQuestions[currentIndex];
    const isCorrect = selectedOption === q.correctAnswer;
    const record = { question: q.question, options: q.options, correctIndex: q.correctAnswer, chosenIndex: selectedOption, isCorrect };
    const updatedAnswers = [...answers, record];
    setAnswers(updatedAnswers);
    let newScore = score;
    if (isCorrect) { newScore += 1; setScore(newScore); }
    const nextIndex = currentIndex + 1;
    setSelectedOption(null);
    if (nextIndex >= adaptiveQuestions.length) {
      const pct = Math.round((newScore / adaptiveQuestions.length) * 100);
      updateProgress("test", pct, updatedAnswers);
      setPreviousAnswers(updatedAnswers);
      setTestPhase("results");
    } else { setCurrentIndex(nextIndex); }
  };

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    setLoadingAI(true); setAiAnswer("");
    try {
      const res = await axios.post("http://localhost:5000/api/ai/ask",
        { topic: topicData.title, question: aiQuestion },
        { headers: authHeader() });
      setAiAnswer(res.data?.answer || "No answer received");
    } catch { setAiAnswer("AI failed. Try again."); }
    setLoadingAI(false);
  };

  if (!topicData) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={s.spinner} />
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "12px" }}>Loading topic...</p>
      </div>
    </div>
  );

  const pageTitle = topicData.title.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const prevCorrect    = previousAnswers.filter(a => a.isCorrect).length;
  const prevTotal      = previousAnswers.length;
  const prevPct        = prevTotal ? Math.round((prevCorrect / prevTotal) * 100) : 0;
  const prevScoreColor = prevPct >= 70 ? "#16a34a" : prevPct >= 40 ? "#d97706" : "#dc2626";
  const prevScoreBg    = prevPct >= 70 ? "#f0fdf4" : prevPct >= 40 ? "#fffbeb" : "#fef2f2";
  const hasPrevious    = previousAnswers.length > 0;

  const tabs = [
    { key: "theory", label: "📖  Theory" },
    { key: "videos", label: "🎬  Videos" },
    { key: "test",   label: "✏️  Test"   },
  ];

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerBreadcrumb}>{subjectName.replace(/-/g, " ")} › {pageTitle}</div>
        <h1 style={s.headerTitle}>{pageTitle}</h1>
      </div>

      <div style={s.tabRow}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ ...s.tabBtn, ...(activeTab === tab.key ? s.tabBtnActive : {}) }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* THEORY TAB */}
      {activeTab === "theory" && (
        <div style={s.theoryCard}>
          <div style={s.theoryAccent} />
          <div style={s.theoryBody}>
            {topicData.theory.split("\n").map((line, i) => {
              if (!line.trim()) return <div key={i} style={{ height: "8px" }} />;
              if (line.trim().endsWith(":") && line.length < 60) return <p key={i} style={s.theoryHeading}>{line}</p>;
              if (line.trim().startsWith("-")) return (
                <div key={i} style={s.theoryBullet}><span style={s.bulletDot} /><span>{line.trim().slice(1).trim()}</span></div>
              );
              return <p key={i} style={s.theoryPara}>{line}</p>;
            })}
          </div>
          <div style={s.aiBox}>
            <div style={s.aiBoxHeader}><span style={s.aiBoxTitle}>🤖 Ask AI about this topic</span></div>
            <div style={{ display: "flex", gap: "10px" }}>
              <textarea value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} placeholder="Ask a doubt..." rows={2} style={s.aiInput} />
              <button onClick={askAI} disabled={loadingAI} style={s.aiBtn}>{loadingAI ? "..." : "Ask"}</button>
            </div>
            {aiAnswer && <div style={s.aiAnswer}><ReactMarkdown>{aiAnswer}</ReactMarkdown></div>}
          </div>
        </div>
      )}

      {/* VIDEOS TAB */}
      {activeTab === "videos" && (
        <div>
          {topicData.videos.length === 0 ? (
            <div style={s.emptyState}><div style={s.emptyIcon}>🎬</div><p style={s.emptyText}>No videos available for this topic yet.</p></div>
          ) : topicData.videos.map((video, i) => (
            <div key={i} style={s.videoCard}>
              <div style={s.videoLabel}>Video {i + 1}</div>
              <div style={s.videoWrap}><iframe src={`https://www.youtube.com/embed/${video}`} title={`Video ${i + 1}`} allowFullScreen style={{ width: "100%", height: "100%", border: "none", borderRadius: "10px" }} /></div>
            </div>
          ))}
          <div style={{ ...s.aiBox, marginTop: "24px", borderRadius: "14px", border: "1px solid var(--border-color)" }}>
            <div style={s.aiBoxHeader}><span style={s.aiBoxTitle}>🤖 Still have doubts? Ask AI</span></div>
            <div style={{ display: "flex", gap: "10px" }}>
              <textarea value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} placeholder="Ask anything..." rows={2} style={s.aiInput} />
              <button onClick={askAI} disabled={loadingAI} style={s.aiBtn}>{loadingAI ? "..." : "Ask"}</button>
            </div>
            {aiAnswer && <div style={s.aiAnswer}><ReactMarkdown>{aiAnswer}</ReactMarkdown></div>}
          </div>
        </div>
      )}

      {/* TEST TAB */}
      {activeTab === "test" && adaptiveQuestions.length > 0 && (
        <div style={s.testCard}>

          {/* START SCREEN */}
          {testPhase === "start" && (
            <div style={s.startScreen}>
              <div style={s.startIconWrap}>✏️</div>
              <h2 style={s.startTitle}>Test Your Knowledge</h2>
              <p style={s.startSub}>{adaptiveQuestions.length} questions · Multiple choice · AI-powered report</p>
              {hasPrevious && (
                <div style={{ ...s.prevBanner, background: prevScoreBg, borderColor: prevScoreColor + "44" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ ...s.prevCircle, borderColor: prevScoreColor }}>
                      <span style={{ fontSize: "20px", fontWeight: 700, color: prevScoreColor, lineHeight: 1 }}>{prevPct}%</span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{prevCorrect}/{prevTotal}</span>
                    </div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>Your last attempt</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>{prevCorrect} correct · {prevTotal - prevCorrect} wrong · {prevTotal} total</p>
                    </div>
                    <button onClick={() => setTestPhase("previous")} style={s.viewPrevBtn}>View Report →</button>
                  </div>
                </div>
              )}
              <div style={s.startMeta}>
                <div style={s.startMetaItem}><span style={s.startMetaNum}>{adaptiveQuestions.length}</span><span style={s.startMetaLabel}>Questions</span></div>
                <div style={s.startMetaDivider} />
                <div style={s.startMetaItem}><span style={s.startMetaNum}>MCQ</span><span style={s.startMetaLabel}>Format</span></div>
                <div style={s.startMetaDivider} />
                <div style={s.startMetaItem}><span style={s.startMetaNum}>AI</span><span style={s.startMetaLabel}>Feedback</span></div>
              </div>
              <button onClick={() => setTestPhase("question")} style={s.startBtn}>{hasPrevious ? "Retry Test →" : "Start Test →"}</button>
            </div>
          )}

          {/* PREVIOUS REPORT */}
          {testPhase === "previous" && (
            <div>
              <div style={s.prevReportHeader}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last Attempt</p>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>Previous Performance</h3>
                </div>
                <button onClick={() => setTestPhase("start")} style={s.backBtn}>← Back</button>
              </div>
              <ResultsView answers={previousAnswers} totalQuestions={adaptiveQuestions.length} topicTitle={topicData.title} subjectName={subjectName} onRetry={resetTest} isPrevious={true} topicDataRef={topicData} />
              <div style={{ textAlign: "center", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border-color)" }}>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>Ready to improve your score?</p>
                <button onClick={() => { resetTest(); setTestPhase("question"); }} style={s.startBtn}>Start New Attempt →</button>
              </div>
            </div>
          )}

          {/* QUESTION PHASE */}
          {testPhase === "question" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>Question {currentIndex + 1} of {adaptiveQuestions.length}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {hasPrevious && (
                      <button onClick={() => setShowPrevious(v => !v)} style={s.peekBtn}>
                        {showPrevious ? "Hide last attempt" : `Last: ${prevPct}%`}
                      </button>
                    )}
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#6366f1" }}>{Math.round((currentIndex / adaptiveQuestions.length) * 100)}% done</span>
                  </div>
                </div>
                <div style={{ height: "6px", background: "var(--border-color)", borderRadius: "6px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(currentIndex / adaptiveQuestions.length) * 100}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: "6px", transition: "width 0.4s ease" }} />
                </div>
              </div>

              {showPrevious && hasPrevious && currentIndex < previousAnswers.length && (
                <div style={s.prevMiniPanel}>
                  <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your previous answer for this question</p>
                  <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{previousAnswers[currentIndex].question}</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", padding: "4px 12px", borderRadius: "20px", background: previousAnswers[currentIndex].isCorrect ? "#dcfce7" : "#fee2e2", color: previousAnswers[currentIndex].isCorrect ? "#166534" : "#991b1b", fontWeight: 600 }}>
                      You chose: {previousAnswers[currentIndex].options[previousAnswers[currentIndex].chosenIndex]}
                    </span>
                    {!previousAnswers[currentIndex].isCorrect && (
                      <span style={{ fontSize: "13px", padding: "4px 12px", borderRadius: "20px", background: "#dcfce7", color: "#166534", fontWeight: 600 }}>
                        Correct: {previousAnswers[currentIndex].options[previousAnswers[currentIndex].correctIndex]}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div style={s.questionBox}>
                <span style={s.questionNum}>Q{currentIndex + 1}</span>
                <h3 style={s.questionText}>{adaptiveQuestions[currentIndex].question}</h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                {adaptiveQuestions[currentIndex].options.map((option, i) => (
                  <OptionRow key={i} opt={option} i={i} isSelected={selectedOption === i} onClick={() => setSelectedOption(i)} />
                ))}
              </div>

              <button onClick={handleAdaptiveAnswer} disabled={selectedOption === null} style={{
                width: "100%", padding: "14px", borderRadius: "10px", border: "none",
                background: selectedOption === null ? "var(--bg-secondary)" : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                color: selectedOption === null ? "var(--text-muted)" : "white",
                fontSize: "15px", fontWeight: 600,
                cursor: selectedOption === null ? "not-allowed" : "pointer", transition: "all 0.2s"
              }}>
                {currentIndex + 1 === adaptiveQuestions.length ? "Finish Test 🎯" : "Next Question →"}
              </button>
            </div>
          )}

          {/* RESULTS */}
          {testPhase === "results" && (
            <ResultsView answers={answers} totalQuestions={adaptiveQuestions.length} topicTitle={topicData.title} subjectName={subjectName} onRetry={resetTest} isPrevious={false} topicDataRef={topicData} />
          )}

        </div>
      )}
    </div>
  );
};


/* STYLES */
const s = {
  page:             { maxWidth: "820px", margin: "0 auto", padding: "40px 24px 80px" },
  header:           { marginBottom: "32px" },
  headerBreadcrumb: { fontSize: "12px", color: "var(--text-muted)", textTransform: "capitalize", letterSpacing: "0.04em", marginBottom: "8px" },
  headerTitle:      { fontSize: "30px", fontWeight: 800, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 },

  tabRow:      { display: "flex", gap: "8px", marginBottom: "28px", borderBottom: "2px solid var(--border-color)" },
  tabBtn:      { padding: "10px 20px", borderRadius: "8px 8px 0 0", border: "none", background: "transparent", fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer", transition: "all 0.15s", marginBottom: "-2px", borderBottom: "2px solid transparent" },
  tabBtnActive:{ color: "#6366f1", borderBottom: "2px solid #6366f1", background: "var(--bg-secondary)" },

  theoryCard:    { background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow-sm)" },
  theoryAccent:  { height: "4px", background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)" },
  theoryBody:    { padding: "32px", background: "var(--bg-card)" },
  theoryHeading: { fontSize: "14px", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", margin: "20px 0 8px" },
  theoryPara:    { fontSize: "15px", color: "var(--text-primary)", lineHeight: 1.8, margin: "0 0 8px" },
  theoryBullet:  { display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "15px", color: "var(--text-primary)", lineHeight: 1.7, marginBottom: "6px" },
  bulletDot:     { width: "6px", height: "6px", borderRadius: "50%", background: "#6366f1", flexShrink: 0, marginTop: "8px" },

  aiBox:       { borderTop: "1px solid var(--border-color)", background: "var(--bg-secondary)", padding: "20px 32px" },
  aiBoxHeader: { marginBottom: "12px" },
  aiBoxTitle:  { fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" },
  aiInput:     { flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "14px", outline: "none", fontFamily: "inherit", resize: "none", background: "var(--bg-input)", color: "var(--text-primary)" },
  aiBtn:       { padding: "10px 20px", borderRadius: "8px", border: "none", background: "linear-gradient(90deg,#6366f1,#4f46e5)", color: "white", fontWeight: 600, fontSize: "14px", cursor: "pointer", flexShrink: 0, alignSelf: "flex-end" },
  aiAnswer:    { marginTop: "14px", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-color)", padding: "14px 16px", fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.7 },

  videoCard:   { marginBottom: "24px", background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow-sm)" },
  videoLabel:  { padding: "12px 20px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)" },
  videoWrap:   { padding: "16px", height: "420px" },
  emptyState:  { textAlign: "center", padding: "60px 20px" },
  emptyIcon:   { fontSize: "48px", marginBottom: "12px" },
  emptyText:   { color: "var(--text-muted)", fontSize: "15px" },

  testCard:       { background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", padding: "32px", boxShadow: "var(--shadow-sm)" },
  startScreen:    { display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0 10px" },
  startIconWrap:  { fontSize: "52px", marginBottom: "16px" },
  startTitle:     { fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px", textAlign: "center" },
  startSub:       { fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 24px", textAlign: "center", lineHeight: 1.6 },
  startMeta:      { display: "flex", alignItems: "center", gap: "24px", marginBottom: "28px", background: "var(--bg-secondary)", borderRadius: "12px", padding: "16px 28px", border: "1px solid var(--border-color)" },
  startMetaItem:  { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" },
  startMetaNum:   { fontSize: "20px", fontWeight: 800, color: "var(--text-primary)" },
  startMetaLabel: { fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" },
  startMetaDivider:{ width: "1px", height: "36px", background: "var(--border-color)" },
  startBtn:       { padding: "14px 40px", borderRadius: "10px", border: "none", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", color: "white", fontSize: "16px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" },

  prevBanner:  { width: "100%", borderRadius: "12px", border: "1px solid", padding: "16px 20px", marginBottom: "20px" },
  prevCircle:  { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "60px", height: "60px", borderRadius: "50%", border: "2.5px solid", flexShrink: 0 },
  viewPrevBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },

  prevReportHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)" },
  backBtn:  { padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" },
  peekBtn:  { fontSize: "12px", padding: "4px 12px", borderRadius: "20px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 500 },
  prevMiniPanel: { background: "var(--bg-secondary)", border: "1px solid #fde68a", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px" },

  questionBox:  { display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "20px", padding: "20px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" },
  questionNum:  { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "6px", flexShrink: 0, marginTop: "2px" },
  questionText: { fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: 0, lineHeight: 1.6 },

  scoreBanner:  { display: "flex", alignItems: "center", gap: "24px", border: "1px solid", borderRadius: "14px", padding: "24px", marginBottom: "24px" },
  scoreCircle:  { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "90px", height: "90px", borderRadius: "50%", border: "3px solid", flexShrink: 0 },
  retryBtn:     { background: "var(--bg-card)", border: "1.5px solid var(--border-color)", borderRadius: "8px", padding: "8px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "var(--text-primary)" },
  reportCard:   { background: "var(--bg-card)", borderRadius: "12px", padding: "18px 20px", marginBottom: "14px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" },

  explainBtn: { background: "linear-gradient(90deg,#6366f1,#4f46e5)", color: "white", border: "none", borderRadius: "7px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  explainBox: { background: "var(--bg-secondary)", border: "1px solid #ddd6fe", borderRadius: "8px", padding: "14px 16px", marginTop: "4px" },
  spinner:    { width: "32px", height: "32px", border: "3px solid var(--border-color)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" },

  genWrap:    { background: "var(--bg-card)", borderRadius: "14px", border: "1.5px solid var(--border-color)", padding: "20px 22px", boxShadow: "var(--shadow-sm)" },
  genIdle:    { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" },
  genTitle:   { margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" },
  genSub:     { margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 },
  genBtn:     { padding: "10px 22px", borderRadius: "8px", border: "none", background: "linear-gradient(90deg,#8b5cf6,#6366f1)", color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer", flexShrink: 0, boxShadow: "0 2px 8px rgba(139,92,246,0.3)" },
  genCloseBtn:{ background: "none", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" },
  aiBadge:    { fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: "#ede9fe", color: "#6d28d9" },
};

if (typeof document !== "undefined") {
  const id = "topicpage-styles";
  if (!document.getElementById(id)) {
    const tag = document.createElement("style");
    tag.id = id;
    tag.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(tag);
  }
}

export default TopicPage;