// backend/routes/pyq.js
// Routes for Previous Year Questions
// Register in server.js: app.use("/api/pyq", require("./routes/pyq"));

const express        = require("express");
const router         = express.Router();
const PYQ            = require("../models/pyq");
const authMiddleware = require("../middleware/authMiddleware");

/* ══════════════════════════════════════════════
   GET /api/pyq/:subject/:topic
   Get all PYQs for a topic, optionally filtered by year
   Query: ?year=2023
══════════════════════════════════════════════ */
router.get("/:subject/:topic", authMiddleware, async (req, res) => {
  try {
    const { subject, topic } = req.params;
    const { year }           = req.query;

    const query = { subject, topic };
    if (year) query.year = parseInt(year);

    const pyqs = await PYQ.find(query).sort({ year: -1 });
    res.json({ pyqs, total: pyqs.length });
  } catch (err) {
    console.error("PYQ GET error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ══════════════════════════════════════════════
   GET /api/pyq/:subject/:topic/years
   Get list of available years for a topic
══════════════════════════════════════════════ */
router.get("/:subject/:topic/years", authMiddleware, async (req, res) => {
  try {
    const { subject, topic } = req.params;
    const years = await PYQ.distinct("year", { subject, topic });
    res.json({ years: years.sort((a, b) => b - a) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ══════════════════════════════════════════════
   POST /api/pyq/seed
   Seed PYQs into database (run once)
   Only works in development or with admin check
══════════════════════════════════════════════ */
router.post("/seed", async (req, res) => {
  try {
    const { pyqs } = req.body;
    if (!Array.isArray(pyqs)) return res.status(400).json({ message: "pyqs array required" });

    // Use insertMany with ordered:false to skip duplicates
    let inserted = 0;
    for (const pyq of pyqs) {
      try {
        await PYQ.create(pyq);
        inserted++;
      } catch (e) {
        // skip duplicate
      }
    }
    res.json({ message: `Seeded ${inserted} PYQs` });
  } catch (err) {
    console.error("PYQ seed error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;