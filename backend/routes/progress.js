// backend/routes/progress.js
// FIXED — uses JWT auth middleware, userId comes from token not URL/body

const express        = require("express");
const router         = express.Router();
const Progress       = require("../models/progress");
const authMiddleware = require("../middleware/authMiddleware");

const TOTAL_TOPICS = {
  "operating-systems": 10, "computer-networks": 10, "data-structures": 10,
  "algorithms": 10, "dbms": 10, "compiler-design": 10,
  "discrete-mathematics": 10, "theory-of-computation": 10
};

/* POST /api/progress — save test result */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { subject, topic, section, score, answers } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({ message: "subject and topic are required" });
    }

    await Progress.findOneAndUpdate(
      { userId, subject, topic },
      {
        $set: {
          userId, subject, topic,
          section:     section || "test",
          testScore:   score,
          lastAttempt: answers || [],
          completedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    res.json({ message: "Progress saved successfully" });
  } catch (err) {
    console.error("Progress POST error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* GET /api/progress/:subject — all topics in a subject */
router.get("/:subject", authMiddleware, async (req, res) => {
  try {
    const userId  = req.userId;
    const subject = req.params.subject;
    const docs    = await Progress.find({ userId, subject });

    const total     = TOTAL_TOPICS[subject] || 10;
    const attempted = docs.length;
    const avgScore  = attempted === 0 ? 0 : Math.round(docs.reduce((s, d) => s + d.testScore, 0) / attempted);

    res.json({ subject, attempted, total, avgScore, topics: docs });
  } catch (err) {
    console.error("Progress GET subject error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* GET /api/progress/:subject/:topic — single topic */
router.get("/:subject/:topic", authMiddleware, async (req, res) => {
  try {
    const userId  = req.userId;
    const subject = req.params.subject;
    const topic   = req.params.topic;

    const doc = await Progress.findOne({ userId, subject, topic });
    if (!doc) return res.json({ found: false });

    res.json({ found: true, testScore: doc.testScore, lastAttempt: doc.lastAttempt || [] });
  } catch (err) {
    console.error("Progress GET topic error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;