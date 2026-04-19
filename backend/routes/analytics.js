// backend/routes/analytics.js
// FINAL — JWT auth, leaderboard endpoint added

const express        = require("express");
const Progress       = require("../models/progress");
const User           = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* ═══════════════════════════════════════════
   GET /api/analytics
   Returns subject progress + topic breakdown
   for the logged-in user.
═══════════════════════════════════════════ */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const docs   = await Progress.find({ userId });

    const subjects = {};
    const topics   = {};

    docs.forEach(d => {
      const subject = d.subject || "unknown";
      const topic   = d.topic   || "unknown";
      const score   = typeof d.testScore === "number" ? d.testScore : 0;

      if (!subjects[subject]) { subjects[subject] = { total: 0, count: 0 }; topics[subject] = []; }
      subjects[subject].total += score;
      subjects[subject].count += 1;
      topics[subject].push({ topic, score });
    });

    const subjectProgress = Object.keys(subjects).map(s => ({
      subject:  s,
      progress: subjects[s].count === 0 ? 0 : Math.round(subjects[s].total / subjects[s].count)
    }));

    res.json({ subjects: subjectProgress, topics });
  } catch (error) {
    console.log("Analytics Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ═══════════════════════════════════════════
   GET /api/analytics/leaderboard
   Returns top 10 users by average score.
═══════════════════════════════════════════ */
router.get("/leaderboard", authMiddleware, async (req, res) => {
  try {
    const allProgress = await Progress.find({});

    // Group scores by userId
    const userMap = {};
    allProgress.forEach(doc => {
      if (!userMap[doc.userId]) userMap[doc.userId] = { scores: [], topicsAttempted: 0 };
      userMap[doc.userId].scores.push(doc.testScore);
      userMap[doc.userId].topicsAttempted += 1;
    });

    // Fetch user names for all userIds
    const userIds = Object.keys(userMap);
    const users   = await User.find({ _id: { $in: userIds } }).select("name");
    const nameMap = {};
    users.forEach(u => { nameMap[u._id.toString()] = u.name; });

    // Build + sort leaderboard
    const leaderboard = userIds
      .map(userId => ({
        name:            nameMap[userId] || "Anonymous",
        avgScore:        userMap[userId].scores.length === 0 ? 0
                           : Math.round(userMap[userId].scores.reduce((a, b) => a + b, 0) / userMap[userId].scores.length),
        topicsAttempted: userMap[userId].topicsAttempted,
        isCurrentUser:   userId === req.userId.toString(),
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));

    res.json({ leaderboard });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;