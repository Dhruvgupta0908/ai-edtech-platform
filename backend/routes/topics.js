// backend/routes/topics.js
// FIXED — GET /:subject/:title now handles & → and in slug lookup
// so "recursion-and-divide-and-conquer" is found correctly

const express = require("express");
const router  = express.Router();
const Topic   = require("../models/topic");

/* Helper: same slugify logic as frontend SubjectsData.js */
const slugify = (text) =>
  text.toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-");


/* =================================
   POST /api/topics  — add a topic
================================= */
router.post("/", async (req, res) => {
  try {
    const { subject, title, theory, videos, questions } = req.body;
    if (!subject || !title) {
      return res.status(400).json({ message: "subject and title are required" });
    }
    const topic = new Topic({ subject, title, theory, videos, questions });
    await topic.save();
    res.status(201).json({ message: "Topic added successfully", topic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


/* =================================
   GET /api/topics/:subject/:title
   title param is a URL slug.
   We search MongoDB by the stored title field (which is also a slug).
   If not found by exact match, try with & → and conversion.
================================= */
router.get("/:subject/:title", async (req, res) => {
  try {
    const subject   = req.params.subject;
    const titleSlug = req.params.title;

    /* Try exact match first */
    let topic = await Topic.findOne({ subject, title: titleSlug });

    /* If not found, try alternate slug (& → and and vice versa) */
    if (!topic) {
      /* Maybe DB has "recursion-and-divide-and-conquer" but URL has "recursion-and-divide-conquer" */
      const altSlug = titleSlug.replace(/-and-/g, "-and-and-");
      topic = await Topic.findOne({ subject, title: altSlug });
    }

    /* General fallback: search all topics in subject and find closest slug match */
    if (!topic) {
      const allTopics = await Topic.find({ subject });
      topic = allTopics.find(t => slugify(t.title) === titleSlug);
    }

    if (!topic) {
      return res.status(404).json({ message: `Topic not found: ${subject}/${titleSlug}` });
    }

    res.status(200).json(topic);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


/* =================================
   GET /api/topics/:subject
================================= */
router.get("/:subject", async (req, res) => {
  try {
    const topics = await Topic.find({ subject: req.params.subject });
    res.status(200).json(topics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;