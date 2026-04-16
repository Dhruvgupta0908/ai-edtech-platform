// frontend/src/pages/AnalyticsPage.jsx
// FIXED — replaced var(--color-*) with var(--*) to match our CSS variable names
// and replaced hardcoded "white" card backgrounds with var(--bg-card)

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Chart, registerables } from "chart.js";
import { authHeader } from "../utils/auth";

Chart.register(...registerables);

const getColor   = s => s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444";
const getBadge   = s => s >= 70 ? { cls: "badge-strong",   label: "strong"     }
                      : s >= 40 ? { cls: "badge-moderate", label: "moderate"   }
                      :           { cls: "badge-weak",      label: "needs work" };
const fmtSubject = s => s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

/* ── MetricCard ── */
const MetricCard = ({ label, value, sub, valueStyle }) => (
  <div style={styles.metricCard}>
    <p style={styles.metricLabel}>{label}</p>
    <p style={{ ...styles.metricValue, ...valueStyle }}>{value}</p>
    <p style={styles.metricSub}>{sub}</p>
  </div>
);

/* ── Bar Chart ── */
const SubjectBarChart = ({ subjects }) => {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!subjects.length || !canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const isDark = document.documentElement.classList.contains("dark");
    const tickColor = isDark ? "#94a3b8" : "#64748b";
    const gridColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: subjects.map(s => fmtSubject(s.subject)),
        datasets: [{ data: subjects.map(s => s.progress), backgroundColor: subjects.map(s => getColor(s.progress)), borderRadius: 4, borderSkipped: false, barThickness: 24 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => " " + ctx.parsed.y + "%" } } },
        scales: {
          x: { ticks: { color: tickColor, font: { size: 10 }, maxRotation: 35, autoSkip: false }, grid: { display: false }, border: { display: false } },
          y: { min: 0, max: 100, ticks: { color: tickColor, font: { size: 11 }, callback: v => v + "%" }, grid: { color: gridColor }, border: { display: false } }
        }
      }
    });
    return () => chartRef.current?.destroy();
  }, [subjects]);

  return <div style={{ position: "relative", width: "100%", height: "220px" }}><canvas ref={canvasRef} /></div>;
};

/* ── Donut Chart ── */
const DonutChart = ({ strong, weak, total }) => {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  const moderate  = total - strong - weak;
  const segments  = [
    { label: "Strong (≥70%)",     value: strong,   color: "#22c55e" },
    { label: "Moderate (40–69%)", value: moderate, color: "#f59e0b" },
    { label: "Needs work (<40%)", value: weak,     color: "#ef4444" }
  ];

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: { datasets: [{ data: segments.map(s => s.value), backgroundColor: segments.map(s => s.color), borderWidth: 0, hoverOffset: 4 }] },
      options: { responsive: false, cutout: "68%", plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => " " + ctx.parsed + " topics" } } } }
    });
    return () => chartRef.current?.destroy();
  }, [strong, weak, total]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "16px" }}>
      <canvas ref={canvasRef} width={140} height={140} />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-primary)" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: s.color, flexShrink: 0 }} />
            <span>{s.label}</span>
            <span style={{ fontWeight: 600, marginLeft: "auto", paddingLeft: "16px" }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Topic List ── */
const TopicList = ({ topics }) => {
  if (!topics.length) return <p style={{ fontSize: "13px", color: "var(--text-secondary)", padding: "8px 0" }}>No topics attempted yet.</p>;
  return (
    <>
      {topics.map((t, i) => {
        const badge = getBadge(t.score);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "0.5px solid var(--border-color)" }}>
            <span style={{ fontSize: "13px", color: "var(--text-primary)", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.topic}</span>
            <div style={{ width: "120px", height: "6px", background: "var(--border-color)", borderRadius: "3px", overflow: "hidden", flexShrink: 0 }}>
              <div style={{ height: "100%", borderRadius: "3px", width: `${t.score}%`, background: getColor(t.score) }} />
            </div>
            <span style={{ fontSize: "12px", fontWeight: 500, minWidth: "34px", textAlign: "right", flexShrink: 0, color: getColor(t.score) }}>{t.score}%</span>
            <span style={{
              fontSize: "11px", padding: "2px 8px", borderRadius: "20px", flexShrink: 0,
              background: badge.cls === "badge-strong" ? "#dcfce7" : badge.cls === "badge-moderate" ? "#fef3c7" : "#fee2e2",
              color:      badge.cls === "badge-strong" ? "#166534" : badge.cls === "badge-moderate" ? "#92400e" : "#991b1b",
            }}>{badge.label}</span>
          </div>
        );
      })}
    </>
  );
};


/* ── Main Page ── */
const AnalyticsPage = () => {
  const [analytics,       setAnalytics]       = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading,         setLoading]         = useState(true);

  useEffect(() => {
    axios.get("https://ai-edtech-backend-r2y7.onrender.com/api/analytics", { headers: authHeader() })
      .then(res => {
        setAnalytics(res.data);
        if (res.data.subjects.length > 0) setSelectedSubject(res.data.subjects[0].subject);
      })
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "80px 40px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>Loading analytics...</div>;
  if (!analytics) return <div style={{ padding: "80px 40px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>Could not load analytics. Make sure the backend is running.</div>;

  const allTopics    = Object.values(analytics.topics).flat();
  const strongTopics = allTopics.filter(t => t.score >= 70);
  const weakTopics   = allTopics.filter(t => t.score < 40);
  const avgScore     = allTopics.length ? Math.round(allTopics.reduce((a, b) => a + b.score, 0) / allTopics.length) : 0;
  const topicData    = analytics.topics[selectedSubject] || [];
  const recommendations = weakTopics.slice(0, 4);
  const nextTopic    = weakTopics[0];

  return (
    <div style={{ padding: "40px", maxWidth: "960px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>Learning Analytics</h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>Your progress across all subjects</p>
      </div>

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "2rem" }}>
        <MetricCard label="Avg score"        value={`${avgScore}%`}       sub="across all topics"   />
        <MetricCard label="Topics attempted" value={allTopics.length}      sub="of all available"    />
        <MetricCard label="Strong topics"    value={strongTopics.length}   sub="score ≥ 70%"  valueStyle={{ color: "#16a34a" }} />
        <MetricCard label="Needs work"       value={weakTopics.length}     sub="score < 40%"  valueStyle={{ color: "#dc2626" }} />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "2rem" }}>
        <div>
          <p style={styles.sectionTitle}>Subject progress</p>
          <div style={styles.card}>
            <p style={styles.chartLabel}>avg score per subject (%)</p>
            <SubjectBarChart subjects={analytics.subjects} />
          </div>
        </div>
        <div>
          <p style={styles.sectionTitle}>Topic distribution</p>
          <div style={{ ...styles.card, height: "calc(100% - 30px)" }}>
            <p style={styles.chartLabel}>strong vs needs work</p>
            <DonutChart strong={strongTopics.length} weak={weakTopics.length} total={allTopics.length} />
          </div>
        </div>
      </div>

      {/* Topic Scores */}
      <div style={{ marginBottom: "2rem" }}>
        <p style={styles.sectionTitle}>Topic scores</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1rem" }}>
          {analytics.subjects.map((s, i) => (
            <button key={i} onClick={() => setSelectedSubject(s.subject)} style={{
              fontSize: "12px", padding: "5px 12px", borderRadius: "20px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              background: selectedSubject === s.subject ? "#6366f1" : "var(--bg-secondary)",
              color:      selectedSubject === s.subject ? "white"   : "var(--text-secondary)",
              border:     selectedSubject === s.subject ? "1px solid #6366f1" : "1px solid var(--border-color)",
            }}>
              {s.subject.replace(/-/g, " ")}
            </button>
          ))}
        </div>
        <div style={styles.card}><TopicList topics={topicData} /></div>
      </div>

      {/* Recommendations + Next Topic */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "2rem" }}>
        <div>
          <p style={styles.sectionTitle}>Focus areas</p>
          <div style={styles.card}>
            {recommendations.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", padding: "4px 0" }}>No weak topics detected. Keep it up!</p>
            ) : recommendations.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 0", borderBottom: "0.5px solid var(--border-color)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", flexShrink: 0, marginTop: "4px" }} />
                <div>
                  <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: "0 0 2px" }}>{t.topic}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>Score: {t.score}% — review theory and retry</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p style={styles.sectionTitle}>Study next</p>
          {nextTopic ? (
            <div style={{ background: "var(--bg-secondary)", borderLeft: "3px solid #6366f1", borderRadius: "0 8px 8px 0", padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", border: "1px solid var(--border-color)" }}>
              <div>
                <p style={{ fontSize: "11px", color: "#6366f1", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>Recommended next</p>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{nextTopic.topic}</p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "3px" }}>Current score: {nextTopic.score}%</p>
              </div>
              <button style={{ fontSize: "12px", padding: "7px 16px", borderRadius: "8px", border: "1px solid #6366f1", background: "transparent", color: "#6366f1", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                Study now →
              </button>
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No urgent topics right now.</p>
          )}
        </div>
      </div>

    </div>
  );
};

const styles = {
  metricCard:  { background: "var(--bg-card)", borderRadius: "8px", padding: "1rem", border: "1px solid var(--border-color)" },
  metricLabel: { fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" },
  metricValue: { fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 3px" },
  metricSub:   { fontSize: "12px", color: "var(--text-secondary)", margin: 0 },
  card:        { background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.25rem" },
  sectionTitle:{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 1rem" },
  chartLabel:  { fontSize: "11px", color: "var(--text-secondary)", margin: "0 0 4px" },
};

export default AnalyticsPage;