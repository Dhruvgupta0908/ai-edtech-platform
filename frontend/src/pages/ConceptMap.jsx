/* eslint-disable react-hooks/refs */
//eslint-disable react-hooks/refs //
// frontend/src/pages/ConceptMap.jsx
// FIXED — Reset View button, page header, list section all use CSS variables

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import subjectsData from "../data/SubjectsData";
import { authHeader } from "../utils/auth";

const slugify = t => t.toLowerCase()
  .replace(/\//g, "-").replace(/\s+/g, "-")
  .replace(/[^\w-]/g, "").replace(/--+/g, "-");

function computeLayers(topics) {
  const layerOf = {};
  const getLayer = (title) => {
    if (layerOf[title] !== undefined) return layerOf[title];
    const topic = topics.find(t => t.title === title);
    if (!topic || topic.prerequisites.length === 0) { layerOf[title] = 0; return 0; }
    const l = Math.max(...topic.prerequisites.map(p => getLayer(p))) + 1;
    layerOf[title] = l; return l;
  };
  topics.forEach(t => getLayer(t.title));
  return layerOf;
}

function buildPositions(topics, layerOf) {
  const NODE_W = 160, NODE_H = 52, GAP_X = 100, GAP_Y = 80, PAD = 40;
  const layers = {};
  topics.forEach(t => { const l = layerOf[t.title]; if (!layers[l]) layers[l] = []; layers[l].push(t); });
  const positions = {};
  const maxLayer  = Math.max(...Object.keys(layers).map(Number));
  Object.entries(layers).forEach(([layerStr, nodes]) => {
    const layer = Number(layerStr);
    nodes.forEach((t, i) => { positions[t.key] = { x: PAD + layer * (NODE_W + GAP_X), y: PAD + i * (NODE_H + GAP_Y), w: NODE_W, h: NODE_H }; });
  });
  const totalLayers = maxLayer + 1;
  const maxPerLayer = Math.max(...Object.values(layers).map(a => a.length));
  return { positions, width: PAD*2 + totalLayers*NODE_W + (totalLayers-1)*GAP_X, height: PAD*2 + maxPerLayer*NODE_H + (maxPerLayer-1)*GAP_Y };
}

function nodeStyle(score) {
  if (score === undefined) return { fill: "#f8fafc", stroke: "#cbd5e1", text: "#64748b", badge: null };
  if (score >= 70) return { fill: "#f0fdf4", stroke: "#86efac", text: "#166534", badge: { bg: "#22c55e", text: "#fff", label: `${score}%` } };
  if (score >= 40) return { fill: "#fffbeb", stroke: "#fde68a", text: "#92400e", badge: { bg: "#f59e0b", text: "#fff", label: `${score}%` } };
  return { fill: "#fef2f2", stroke: "#fca5a5", text: "#991b1b", badge: { bg: "#ef4444", text: "#fff", label: `${score}%` } };
}

function edgePath(from, to) {
  const x1 = from.x + from.w, y1 = from.y + from.h / 2;
  const x2 = to.x,            y2 = to.y  + to.h  / 2;
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

const Legend = () => (
  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
    {[
      { color: "#22c55e", label: "Strong (≥70%)" },
      { color: "#f59e0b", label: "Moderate (40–69%)" },
      { color: "#ef4444", label: "Needs work (<40%)" },
      { color: "#cbd5e1", label: "Not attempted" },
    ].map((l, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
        <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: l.color, display: "inline-block" }} />
        {l.label}
      </div>
    ))}
  </div>
);

export default function ConceptMap() {
  const { subjectName } = useParams();
  const navigate        = useNavigate();
  const svgRef          = useRef(null);
  const subject         = subjectsData[subjectName];

  const [scores,     setScores]     = useState({});
  const [hoveredKey, setHoveredKey] = useState(null);
  const [,           setTooltip]    = useState(null);
  const [transform,  setTransform]  = useState({ x: 0, y: 0, scale: 1 });
  const isPanning  = useRef(false);
  const lastMouse  = useRef({ x: 0, y: 0 });

  const fetchScores = useCallback(() => {
    axios.get("https://ai-edtech-backend-r2y7.onrender.com/api/analytics", { headers: authHeader() })
      .then(res => {
        const topicList = res.data.topics?.[subjectName] || [];
        const map = {};
        topicList.forEach(t => { map[slugify(t.topic)] = t.score; });
        setScores(map);
      }).catch(() => {});
  }, [subjectName]);

  useEffect(() => { fetchScores(); }, [fetchScores]);
  useEffect(() => {
    window.addEventListener("focus", fetchScores);
    return () => window.removeEventListener("focus", fetchScores);
  }, [fetchScores]);

  if (!subject) return <h2 style={{ textAlign: "center", marginTop: "60px", color: "var(--text-primary)" }}>Subject not found</h2>;

  const topics = subject.topics;
  const layerOf = computeLayers(topics);
  const { positions } = buildPositions(topics, layerOf);

  const edges = [];
  topics.forEach(t => {
    t.prerequisites.forEach(prereqTitle => {
      const fromKey = slugify(prereqTitle), toKey = t.key;
      if (positions[fromKey] && positions[toKey]) edges.push({ from: fromKey, to: toKey });
    });
  });

  const onMouseDown = e => { if (e.target.closest(".concept-node")) return; isPanning.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
  const onMouseMove = e => { if (!isPanning.current) return; const dx = e.clientX - lastMouse.current.x; const dy = e.clientY - lastMouse.current.y; lastMouse.current = { x: e.clientX, y: e.clientY }; setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy })); };
  const onMouseUp  = () => { isPanning.current = false; };
  const onWheel    = e => { e.preventDefault(); const delta = e.deltaY > 0 ? 0.9 : 1.1; setTransform(t => ({ ...t, scale: Math.min(2, Math.max(0.3, t.scale * delta)) })); };
  const resetView  = () => setTransform({ x: 0, y: 0, scale: 1 });

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <button onClick={() => navigate(`/subject/${subjectName}`)}
            style={{ background: "none", border: "none", color: "#6366f1", fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: "8px", display: "block" }}>
            ← Back to {subject.title}
          </button>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>Concept Map</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
            {subject.title} · {topics.length} topics · follow arrows to learn in order
          </p>
        </div>
        {/* FIXED: Reset View button now uses CSS variables */}
        <button onClick={resetView} style={{
          padding: "8px 16px", borderRadius: "8px",
          border: "1px solid var(--border-color)",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          fontSize: "13px", fontWeight: 500, cursor: "pointer"
        }}>
          Reset View
        </button>
      </div>

      <Legend />

      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
        🖱 Drag to pan · Scroll to zoom · Click a topic to study it
      </p>

      {/* SVG CANVAS */}
      <div style={{ width: "100%", height: "520px", background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)", overflow: "hidden", position: "relative", marginBottom: "32px" }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}>
        
        <svg ref={svgRef} width="100%" height="100%" style={{ cursor: isPanning.current ? "grabbing" : "grab" }}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
            </marker>
            <marker id="arrow-hover" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#6366f1" />
            </marker>
          </defs>
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {edges.map((e, i) => {
              const from = positions[e.from], to = positions[e.to];
              if (!from || !to) return null;
              const isHighlighted = hoveredKey === e.from || hoveredKey === e.to;
              return <path key={i} d={edgePath(from, to)} fill="none" stroke={isHighlighted ? "#6366f1" : "#94a3b8"} strokeWidth={isHighlighted ? 2.5 : 1.5} markerEnd={isHighlighted ? "url(#arrow-hover)" : "url(#arrow)"} style={{ transition: "stroke 0.2s" }} />;
            })}
            {topics.map(t => {
              const pos = positions[t.key]; if (!pos) return null;
              const score = scores[t.key], ns = nodeStyle(score), isHov = hoveredKey === t.key;
              return (
                <g key={t.key} className="concept-node"
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => navigate(`/topic/${subjectName}/${t.key}`)}
                  onMouseEnter={() => { setHoveredKey(t.key); setTooltip({ key: t.key, score }); }}
                  onMouseLeave={() => { setHoveredKey(null); setTooltip(null); }}
                  style={{ cursor: "pointer" }}>
                  {isHov && <rect x="-2" y="2" width={pos.w + 4} height={pos.h + 4} rx="10" fill="rgba(99,102,241,0.15)" />}
                  <rect width={pos.w} height={pos.h} rx="10" fill={isHov ? "#eef2ff" : ns.fill} stroke={isHov ? "#6366f1" : ns.stroke} strokeWidth={isHov ? 2 : 1.5} style={{ transition: "all 0.15s" }} />
                  {ns.badge && <rect x="0" y="0" width="6" height={pos.h} rx="10" fill={ns.badge.bg} />}
                  <text x={ns.badge ? 16 : 10} y={pos.h / 2} dominantBaseline="middle" fontSize="11" fontWeight={isHov ? "700" : "600"} fill={isHov ? "#3730a3" : ns.text} style={{ transition: "fill 0.15s", fontFamily: "system-ui, sans-serif" }}>
                    {t.title.length > 22 ? (
                      <><tspan x={ns.badge ? 16 : 10} dy="-7">{t.title.slice(0, 22)}</tspan><tspan x={ns.badge ? 16 : 10} dy="14">{t.title.slice(22)}</tspan></>
                    ) : t.title}
                  </text>
                  {ns.badge && (
                    <g transform={`translate(${pos.w - 38}, -8)`}>
                      <rect width="36" height="16" rx="8" fill={ns.badge.bg} />
                      <text x="18" y="8" dominantBaseline="middle" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" style={{ fontFamily: "system-ui, sans-serif" }}>{ns.badge.label}</text>
                    </g>
                  )}
                  {score === undefined && (
                    <text x={pos.w - 10} y={pos.h - 8} fontSize="9" fill="#94a3b8" textAnchor="end" style={{ fontFamily: "system-ui, sans-serif" }}>not started</text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* ZOOM CONTROLS */}
        <div style={{ position: "absolute", bottom: "16px", right: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--border-color)", padding: "8px", boxShadow: "var(--shadow-sm)" }}>
          <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", fontSize: "16px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}
            onClick={() => setTransform(t => ({ ...t, scale: Math.min(2, t.scale * 1.2) }))}>+</button>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{Math.round(transform.scale * 100)}%</span>
          <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", fontSize: "16px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}
            onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.3, t.scale * 0.8) }))}>−</button>
        </div>
      </div>

      {/* TOPIC LIST */}
      <div style={{ marginTop: "8px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>All Topics</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
          {topics.map((t, i) => {
            const score = scores[t.key], ns = nodeStyle(score);
            return (
              <div key={t.key} onClick={() => navigate(`/topic/${subjectName}/${t.key}`)}
                style={{ padding: "12px 14px", borderRadius: "8px", border: `1px solid var(--border-color)`, background: "var(--bg-card)", borderLeft: `4px solid ${ns.stroke}`, cursor: "pointer", transition: "box-shadow 0.15s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{i + 1}. {t.title}</p>
                    {t.prerequisites.length > 0 && (
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>Needs: {t.prerequisites.join(", ")}</p>
                    )}
                  </div>
                  {score !== undefined ? (
                    <span style={{ fontSize: "13px", fontWeight: 700, color: ns.text, flexShrink: 0, marginLeft: "8px" }}>{score}%</span>
                  ) : (
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0, marginLeft: "8px" }}>Not started</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}