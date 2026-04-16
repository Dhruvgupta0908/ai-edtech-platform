// frontend/src/pages/SubjectPage.jsx

import { useParams, useNavigate } from "react-router-dom";
import subjectsData from "../data/SubjectsData";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { authHeader } from "../utils/auth";

const slugify = (text) =>
  text.toLowerCase()
    .replace(/\//g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-");

function SubjectPage() {
  const { subjectName } = useParams();
  const navigate = useNavigate();
  const subject = subjectsData[subjectName];

  const [progressData, setProgressData] = useState([]);
  const [mlPredictions, setMlPredictions] = useState([]);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await axios.get(
        "https://ai-edtech-backend-r2y7.onrender.com/api/analytics",
        { headers: authHeader() }
      );

      const topicList = res.data?.topics?.[subjectName] || [];
      setProgressData(topicList);

      const topicScores = {};
      topicList.forEach((t) => {
        if (t.topic && typeof t.score === "number") {
          topicScores[slugify(t.topic)] = t.score;
        }
      });

      console.log("Topic List:", topicList);
      console.log("Topic Scores:", topicScores);

      if (!topicScores || Object.keys(topicScores).length === 0) {
        setMlPredictions([]);
        return;
      }

      try {
        const mlRes = await axios.post(
          "https://ai-edtech-backend-r2y7.onrender.com/api/ml/predict-struggle",
          {
            subject: subjectName,
            topicScores: topicScores,
          },
          { headers: authHeader() }
        );

        setMlPredictions(mlRes.data?.predictions || []);
      } catch (mlErr) {
        console.log("ML Error:", mlErr.response?.data || mlErr.message);
        setMlPredictions([]);
      }

    } catch (err) {
      console.log("Progress fetch error:", err.response?.data || err.message);
      setMlPredictions([]);
    }
  }, [subjectName]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    const handleFocus = () => fetchProgress();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchProgress]);

  if (!subject) {
    return <h2>Subject Not Found</h2>;
  }

  const getScore = (k) => {
    const t = progressData.find((t) => slugify(t.topic) === k);
    return t ? t.score : 0;
  };

  const mlByTitle = {};
  mlPredictions.forEach((p) => {
    mlByTitle[p.title] = p;
  });

  return (
    <div style={{ padding: "40px", maxWidth: "860px", margin: "0 auto" }}>
      <h1>{subject.title}</h1>

      {subject.topics.map((topic, index) => {
        const score = getScore(topic.key);
        const mlPred = mlByTitle[topic.title];
        const isAtRisk = mlPred?.will_struggle && score === 0;

        return (
          <div
            key={index}
            style={{
              padding: "12px",
              marginBottom: "10px",
              border: isAtRisk ? "1.5px solid orange" : "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{topic.title}</span>

              <button
                onClick={() =>
                  navigate(`/topic/${subjectName}/${topic.key}`)
                }
              >
                {score === 0 ? "Start" : "Retry"}
              </button>
            </div>

            {isAtRisk && (
              <div style={{ marginTop: "6px", fontSize: "12px", color: "orange" }}>
                ⚠ ML Risk: {Math.round(mlPred.confidence * 100)}%
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default SubjectPage;