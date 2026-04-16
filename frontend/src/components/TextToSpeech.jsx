// frontend/src/components/TextToSpeech.jsx
// NEW FILE — drop this into your components folder, no other setup needed.

import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────
   TextToSpeech
   Props:
     text  {string}  — the theory string to read aloud
   Usage:
     <TextToSpeech text={topicData.theory} />
───────────────────────────────────────────────────────────── */
function TextToSpeech({ text }) {
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [isPaused,   setIsPaused]   = useState(false);
  const [supported,  setSupported]  = useState(true);
  const [speed,      setSpeed]      = useState(1);       // 0.75 / 1 / 1.25 / 1.5
  const timerRef = useRef(null);

  /* ── Check browser support ── */
  useEffect(() => {
    if (!window.speechSynthesis) setSupported(false);
  }, []);

  /* ── Cancel + reset whenever the topic changes ── */
  useEffect(() => {
    stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  /* ── Cancel on unmount ── */
  useEffect(() => {
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── helpers ─── */
  const stopAll = () => {
    window.speechSynthesis?.cancel();
    clearInterval(timerRef.current);
    setIsPlaying(false);
    setIsPaused(false);
  };

  /* Chrome has a bug where speechSynthesis silently stops after ~15 s.
     We keep it alive by pausing + resuming every 10 s.              */
  const startChromeWorkaround = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(timerRef.current);
        return;
      }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10_000);
  };

  /* ─── Play / Resume ─── */
  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      startChromeWorkaround();
      return;
    }

    window.speechSynthesis.cancel();
    clearInterval(timerRef.current);

    const utterance      = new SpeechSynthesisUtterance(text);
    utterance.rate       = speed;
    utterance.pitch      = 1;
    utterance.lang       = "en-US";

    utterance.onend = () => {
      clearInterval(timerRef.current);
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      clearInterval(timerRef.current);
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
    startChromeWorkaround();
  };

  /* ─── Pause ─── */
  const handlePause = () => {
    window.speechSynthesis.pause();
    clearInterval(timerRef.current);
    setIsPaused(true);
    setIsPlaying(false);
  };

  /* ─── Stop ─── */
  const handleStop = () => stopAll();

  /* ─── Speed change (only effective on next Play) ─── */
  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    /* If already playing, restart with new speed */
    if (isPlaying || isPaused) {
      stopAll();
    }
  };

  if (!supported) return null;

  const active = isPlaying || isPaused;
  const speeds = [0.75, 1, 1.25, 1.5];

  return (
    <div style={st.wrap}>

      {/* ── Icon + label ── */}
      <span style={st.label}>🔊 Listen to theory</span>

      {/* ── Playback controls ── */}
      <div style={st.controls}>

        {/* Play / Resume */}
        {!isPlaying && (
          <button onClick={handlePlay} style={st.btn} title={isPaused ? "Resume" : "Play"}>
            {isPaused ? "▶ Resume" : "▶ Play"}
          </button>
        )}

        {/* Pause */}
        {isPlaying && (
          <button onClick={handlePause} style={{ ...st.btn, ...st.btnPause }}>
            ⏸ Pause
          </button>
        )}

        {/* Stop */}
        {active && (
          <button onClick={handleStop} style={{ ...st.btn, ...st.btnStop }}>
            ⏹ Stop
          </button>
        )}

      </div>

      {/* ── Speed selector ── */}
      <div style={st.speedRow}>
        {speeds.map(sp => (
          <button
            key={sp}
            onClick={() => handleSpeedChange(sp)}
            style={{
              ...st.speedBtn,
              ...(speed === sp ? st.speedBtnActive : {}),
            }}
          >
            {sp}×
          </button>
        ))}
      </div>

      {/* ── Status pill ── */}
      {isPlaying && <span style={{ ...st.status, color: "#16a34a" }}>● reading aloud...</span>}
      {isPaused  && <span style={{ ...st.status, color: "#d97706" }}>⏸ paused</span>}

    </div>
  );
}


/* ─────────────────────────────────────────
   Styles
───────────────────────────────────────── */
const st = {
  wrap: {
    display:        "flex",
    alignItems:     "center",
    gap:            "12px",
    flexWrap:       "wrap",
    padding:        "10px 16px",
    background:     "#f0fdf4",
    border:         "1px solid #86efac",
    borderRadius:   "10px",
    margin:         "0 0 20px",
  },
  label: {
    fontSize:   "13px",
    fontWeight: 600,
    color:      "#166534",
    flexShrink: 0,
  },
  controls: {
    display: "flex",
    gap:     "8px",
  },
  btn: {
    fontSize:     "13px",
    padding:      "5px 14px",
    borderRadius: "7px",
    border:       "1px solid #22c55e",
    background:   "white",
    color:        "#166534",
    cursor:       "pointer",
    fontWeight:   500,
    transition:   "background 0.15s",
  },
  btnPause: {
    background:   "#22c55e",
    color:        "white",
    borderColor:  "#16a34a",
  },
  btnStop: {
    borderColor: "#fca5a5",
    color:       "#991b1b",
  },
  speedRow: {
    display:   "flex",
    gap:       "4px",
    marginLeft: "4px",
  },
  speedBtn: {
    fontSize:     "11px",
    padding:      "3px 8px",
    borderRadius: "6px",
    border:       "1px solid #d1d5db",
    background:   "white",
    color:        "#6b7280",
    cursor:       "pointer",
    fontWeight:   500,
  },
  speedBtnActive: {
    background:  "#166534",
    color:       "white",
    borderColor: "#166534",
  },
  status: {
    fontSize:   "12px",
    fontStyle:  "italic",
    marginLeft: "4px",
    flexShrink: 0,
  },
};

export default TextToSpeech;