// backend/routes/streak.js
// FIXED — uses JWT auth middleware, no userId in URL

const express        = require("express");
const router         = express.Router();
const Streak         = require("../models/streak");
const authMiddleware = require("../middleware/authMiddleware");

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

/* GET /api/streak */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId    = req.userId;
    const today     = todayStr();
    const yesterday = yesterdayStr();
    const doc       = await Streak.findOne({ userId });

    if (!doc) {
      return res.json({ currentStreak: 0, longestStreak: 0, lastStudyDate: null, studiedToday: false, studyDates: [] });
    }

    const isStreakBroken = doc.lastStudyDate && doc.lastStudyDate !== today && doc.lastStudyDate !== yesterday;
    res.json({
      currentStreak: isStreakBroken ? 0 : doc.currentStreak,
      longestStreak: doc.longestStreak,
      lastStudyDate: doc.lastStudyDate,
      studiedToday:  doc.lastStudyDate === today,
      studyDates:    doc.studyDates || []
    });
  } catch (err) {
    console.error("Streak GET error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* POST /api/streak */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId    = req.userId;
    const today     = todayStr();
    const yesterday = yesterdayStr();

    let doc = await Streak.findOne({ userId });

    if (!doc) {
      const newDoc = await Streak.create({ userId, currentStreak: 1, longestStreak: 1, lastStudyDate: today, studyDates: [today] });
      return res.json({ currentStreak: 1, longestStreak: 1, studiedToday: true, studyDates: [today] });
    }

    if (doc.lastStudyDate === today) {
      return res.json({ currentStreak: doc.currentStreak, longestStreak: doc.longestStreak, studiedToday: true, studyDates: doc.studyDates || [] });
    }

    let newStreak;
    if (doc.lastStudyDate === yesterday) {
      newStreak = doc.currentStreak + 1;
    } else {
      newStreak = 1;
    }

    const newDates   = [...new Set([...(doc.studyDates || []), today])];
    const newLongest = Math.max(doc.longestStreak, newStreak);

    doc.currentStreak = newStreak;
    doc.longestStreak = newLongest;
    doc.lastStudyDate = today;
    doc.studyDates    = newDates;
    await doc.save();

    res.json({ currentStreak: newStreak, longestStreak: newLongest, studiedToday: true, studyDates: newDates });
  } catch (err) {
    console.error("Streak POST error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;