import { useState } from "react";
import axios from "axios";

function SocraticTutor({ topic, question, studentAnswer, allOptions, onDismiss }) {
  const [tutorMsg, setTutorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState(false);

  const askTutor = async () => {
    setLoading(true);
    try {
      const res = await axios.post("https://ai-edtech-backend-r2y7.onrender.com/api/ai/socratic", {
        topic,
        question,
        studentAnswer,
        allOptions
      });
      setTutorMsg(res.data.tutorQuestion);
      setAsked(true);
    } catch {
      setTutorMsg("Tutor is unavailable right now. Try reviewing the topic theory.");
    }
    setLoading(false);
  };

  return (
    <div className="socratic-tutor-box">
      <p className="tutor-label">That wasn't quite right.</p>

      {!asked && (
        <button className="tutor-btn" onClick={askTutor} disabled={loading}>
          {loading ? "Thinking..." : "Get a hint from AI Tutor"}
        </button>
      )}

      {tutorMsg && (
        <div className="tutor-question">
          <span className="tutor-icon">💬</span>
          <p>{tutorMsg}</p>
        </div>
      )}

      <button className="dismiss-btn" onClick={onDismiss}>
        Show correct answer
      </button>
    </div>
  );
}

export default SocraticTutor;