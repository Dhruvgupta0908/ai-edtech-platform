// backend/routes/ml.js

const express = require("express");
const axios = require("axios");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "https://ai-edtech-platform-2.onrender.com";

// ⚠️ Make sure keys are LOWERCASE + SLUG FORMAT
const SUBJECT_TOPICS = {
  "operating-systems": [
    // keep your topics here (same as before)
  ],
  // add other subjects in same format
};

// ✅ Slug helper (GLOBAL)
const slugify = (text) =>
  text.toLowerCase()
    .replace(/\//g, "-")
    .replace(/&/g, "and")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-");

/* ═══════════════════════════════════════════════════════
   POST /api/ml/predict-struggle
═══════════════════════════════════════════════════════ */
router.post("/predict-struggle", authMiddleware, async (req, res) => {
  try {
    const { subject, topicScores } = req.body;

    // ✅ DEBUG LOGS
    console.log("Incoming body:", req.body);
    console.log("Subject received:", subject);
    console.log("TopicScores:", topicScores);
    console.log("Available subjects:", Object.keys(SUBJECT_TOPICS));

    // ✅ FIX: normalize subject
    const normalizedSubject = slugify(subject);

    if (!normalizedSubject || !topicScores) {
      return res.status(400).json({
        message: "subject and topicScores are required",
      });
    }

    const topics = SUBJECT_TOPICS[normalizedSubject];

    if (!topics) {
      return res.status(400).json({
        message: `Unknown subject: ${normalizedSubject}`,
      });
    }

    // ── Map scores ──
    const titleToScore = {};
    topics.forEach((t) => {
      const slug = slugify(t.title);
      if (topicScores[slug] !== undefined) {
        titleToScore[t.title] = topicScores[slug];
      }
    });

    const priorScoresInOrder = [];
    const flaskPayload = [];

    topics.forEach((topic, i) => {
      const currentScore = titleToScore[topic.title];

      const prereqScores = topic.prereqs
        .map((p) => titleToScore[p])
        .filter((s) => s !== undefined);

      if (currentScore === undefined && priorScoresInOrder.length > 0) {
        flaskPayload.push({
          title: topic.title,
          position: i,
          prereq_count: topic.prereqs.length,
          prerequisite_scores: prereqScores,
          prior_scores: [...priorScoresInOrder],
        });
      }

      if (currentScore !== undefined) {
        priorScoresInOrder.push(currentScore);
      }
    });

    // ✅ No data case (NOT error)
    if (flaskPayload.length === 0) {
      return res.json({
        predictions: [],
        reason: "not_enough_data",
      });
    }

    // ── Call ML service ──
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      {
        subject: normalizedSubject,
        topics: flaskPayload,
      },
      {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({
      predictions: mlResponse.data.predictions,
    });

  } catch (err) {
    console.error("ML FULL ERROR:", err.response?.data || err.message);

    return res.json({
      predictions: [],
      reason: "ml_failed",
    });
  }
});

module.exports = router;