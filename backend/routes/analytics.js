// backend/routes/analytics.js
// FIXED — uses JWT auth middleware to get userId from token
// Route changed from GET /:userId to GET / (no userId in URL)

const express        = require("express");
const Progress       = require("../models/progress");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;   // comes from JWT via authMiddleware
    const docs   = await Progress.find({ userId });

    const subjects = {};
    const topics   = {};

    docs.forEach(d => {
      const subject = d.subject  || "unknown";
      const topic   = d.topic    || "unknown";
      const score   = typeof d.testScore === "number" ? d.testScore : 0;

      if (!subjects[subject]) {
        subjects[subject] = { total: 0, count: 0 };
        topics[subject]   = [];
      }

      subjects[subject].total += score;
      subjects[subject].count += 1;
      topics[subject].push({ topic, score });
    });

    const subjectProgress = Object.keys(subjects).map(s => ({
      subject:  s,
      progress: subjects[s].count === 0
        ? 0
        : Math.round(subjects[s].total / subjects[s].count)
    }));

    res.json({ subjects: subjectProgress, topics });

  } catch (error) {
    console.log("Analytics Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;