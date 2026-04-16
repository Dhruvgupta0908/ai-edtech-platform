// backend/routes/ml.js

const express        = require("express");
const axios          = require("axios");
const router         = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Correct fallback (ML service, NOT backend)
const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "https://ai-edtech-platform-2.onrender.com";

// SUBJECT_TOPICS remains same
const SUBJECT_TOPICS = { /* keep your existing data unchanged */ };

/* ═══════════════════════════════════════════════════════
   POST /api/ml/predict-struggle
═══════════════════════════════════════════════════════ */
router.post("/predict-struggle", authMiddleware, async (req, res) => {
  try {
    const { subject, topicScores } = req.body;

    if (!subject || !topicScores) {
      return res.status(400).json({
        message: "subject and topicScores are required",
      });
    }

    const topics = SUBJECT_TOPICS[subject];
    if (!topics) {
      return res.status(400).json({
        message: `Unknown subject: ${subject}`,
      });
    }

    // ── Slug helper ──
    const slugify = (text) =>
      text.toLowerCase()
        .replace(/\//g, "-")
        .replace(/&/g, "-")
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "")
        .replace(/--+/g, "-");

    // ── Map scores ──
    const titleToScore = {};
    topics.forEach((t) => {
      const slug = slugify(t.title);
      if (topicScores[slug] !== undefined) {
        titleToScore[t.title] = topicScores[slug];
      }
    });

    // ── Build payload ──
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

    // ── No data case ──
    if (flaskPayload.length === 0) {
      return res.json({
        predictions: [],
        reason: "not_enough_data",
      });
    }

    // ── Call ML service (FIXED HEADERS) ──
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      {
        subject,
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

    // Graceful fallback (VERY IMPORTANT for production)
    return res.json({
      predictions: [],
      reason: "ml_failed",
    });
  }
});

module.exports = router;