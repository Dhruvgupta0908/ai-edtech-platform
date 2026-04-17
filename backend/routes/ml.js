// backend/routes/ml.js
// FIXED:
//   1. SUBJECT_TOPICS now has ALL 8 subjects with full topic + prereqs data
//   2. timeout increased to 25000ms (Render free tier cold start can be slow)
//   3. slugify handles & → and correctly

const express        = require("express");
const axios          = require("axios");
const router         = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "https://ai-edtech-platform-2.onrender.com";

// ── Slug helper — must match frontend SubjectsData.js exactly ──
const slugify = (text) =>
  text.toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-");

// ── Full topic structure for all 8 subjects ──
// prereqs use exact title strings (same as SubjectsData.js)
const SUBJECT_TOPICS = {
  "operating-systems": [
    { title: "Introduction to Operating Systems",  prereqs: [] },
    { title: "System Calls and OS Structure",      prereqs: ["Introduction to Operating Systems"] },
    { title: "Process Concept",                    prereqs: ["System Calls and OS Structure"] },
    { title: "Process Scheduling",                 prereqs: ["Process Concept"] },
    { title: "Threads and Multithreading",         prereqs: ["Process Concept"] },
    { title: "Process Synchronization",            prereqs: ["Process Concept"] },
    { title: "Deadlocks",                          prereqs: ["Process Synchronization"] },
    { title: "Memory Management",                  prereqs: ["Process Concept"] },
    { title: "Virtual Memory",                     prereqs: ["Memory Management"] },
    { title: "File Systems",                       prereqs: ["Memory Management"] },
  ],
  "computer-networks": [
    { title: "Introduction to Computer Networks",  prereqs: [] },
    { title: "OSI and TCP/IP Models",              prereqs: ["Introduction to Computer Networks"] },
    { title: "Physical Layer",                     prereqs: ["OSI and TCP/IP Models"] },
    { title: "Data Link Layer",                    prereqs: ["Physical Layer"] },
    { title: "Network Layer",                      prereqs: ["Data Link Layer"] },
    { title: "Transport Layer",                    prereqs: ["Network Layer"] },
    { title: "Application Layer",                  prereqs: ["Transport Layer"] },
    { title: "Routing Algorithms",                 prereqs: ["Network Layer"] },
    { title: "Congestion Control",                 prereqs: ["Transport Layer"] },
    { title: "Network Security Basics",            prereqs: ["Application Layer"] },
  ],
  "data-structures": [
    { title: "Introduction to Data Structures",    prereqs: [] },
    { title: "Arrays",                             prereqs: ["Introduction to Data Structures"] },
    { title: "Linked Lists",                       prereqs: ["Arrays"] },
    { title: "Stacks",                             prereqs: ["Linked Lists"] },
    { title: "Queues",                             prereqs: ["Stacks"] },
    { title: "Trees",                              prereqs: ["Queues"] },
    { title: "Binary Search Trees",                prereqs: ["Trees"] },
    { title: "Heaps and Priority Queues",          prereqs: ["Trees"] },
    { title: "Graphs",                             prereqs: ["Trees"] },
    { title: "Hashing",                            prereqs: ["Arrays"] },
  ],
  "algorithms": [
    { title: "Algorithm Analysis and Asymptotic Notations", prereqs: [] },
    { title: "Recursion and Divide & Conquer",              prereqs: ["Algorithm Analysis and Asymptotic Notations"] },
    { title: "Greedy Algorithms",                           prereqs: ["Recursion and Divide & Conquer"] },
    { title: "Dynamic Programming",                         prereqs: ["Recursion and Divide & Conquer"] },
    { title: "Backtracking",                                prereqs: ["Recursion and Divide & Conquer"] },
    { title: "Branch and Bound",                            prereqs: ["Backtracking"] },
    { title: "Graph Algorithms",                            prereqs: ["Dynamic Programming"] },
    { title: "Shortest Path Algorithms",                    prereqs: ["Graph Algorithms"] },
    { title: "Minimum Spanning Tree",                       prereqs: ["Graph Algorithms"] },
    { title: "NP-Completeness",                             prereqs: ["Dynamic Programming"] },
  ],
  "dbms": [
    { title: "Introduction to DBMS",      prereqs: [] },
    { title: "ER Model",                  prereqs: ["Introduction to DBMS"] },
    { title: "Relational Model",          prereqs: ["ER Model"] },
    { title: "SQL",                       prereqs: ["Relational Model"] },
    { title: "Relational Algebra",        prereqs: ["Relational Model"] },
    { title: "Normalization",             prereqs: ["Relational Model"] },
    { title: "Transaction Management",    prereqs: ["Normalization"] },
    { title: "Concurrency Control",       prereqs: ["Transaction Management"] },
    { title: "Indexing and Hashing",      prereqs: ["SQL"] },
    { title: "Recovery Techniques",       prereqs: ["Transaction Management"] },
  ],
  "compiler-design": [
    { title: "Introduction to Compilers",        prereqs: [] },
    { title: "Lexical Analysis",                 prereqs: ["Introduction to Compilers"] },
    { title: "Syntax Analysis",                  prereqs: ["Lexical Analysis"] },
    { title: "Parsing Techniques",               prereqs: ["Syntax Analysis"] },
    { title: "Semantic Analysis",                prereqs: ["Parsing Techniques"] },
    { title: "Intermediate Code Generation",     prereqs: ["Semantic Analysis"] },
    { title: "Code Optimization",                prereqs: ["Intermediate Code Generation"] },
    { title: "Code Generation",                  prereqs: ["Code Optimization"] },
    { title: "Symbol Table",                     prereqs: ["Semantic Analysis"] },
    { title: "Runtime Environment",              prereqs: ["Code Generation"] },
  ],
  "discrete-mathematics": [
    { title: "Propositional Logic",        prereqs: [] },
    { title: "Predicate Logic",            prereqs: ["Propositional Logic"] },
    { title: "Set Theory",                 prereqs: ["Predicate Logic"] },
    { title: "Relations and Functions",    prereqs: ["Set Theory"] },
    { title: "Mathematical Induction",     prereqs: ["Relations and Functions"] },
    { title: "Combinatorics",             prereqs: ["Mathematical Induction"] },
    { title: "Recurrence Relations",       prereqs: ["Combinatorics"] },
    { title: "Graph Theory",              prereqs: ["Recurrence Relations"] },
    { title: "Trees",                     prereqs: ["Graph Theory"] },
    { title: "Boolean Algebra",           prereqs: ["Propositional Logic"] },
  ],
  "theory-of-computation": [
    { title: "Introduction to Automata Theory",  prereqs: [] },
    { title: "Finite Automata",                  prereqs: ["Introduction to Automata Theory"] },
    { title: "Regular Expressions",              prereqs: ["Finite Automata"] },
    { title: "Context-Free Grammars",            prereqs: ["Regular Expressions"] },
    { title: "Pushdown Automata",                prereqs: ["Context-Free Grammars"] },
    { title: "Turing Machines",                  prereqs: ["Pushdown Automata"] },
    { title: "Undecidability",                   prereqs: ["Turing Machines"] },
    { title: "Decidability Problems",            prereqs: ["Turing Machines"] },
    { title: "Chomsky Hierarchy",                prereqs: ["Context-Free Grammars"] },
    { title: "Complexity Theory Basics",         prereqs: ["Turing Machines"] },
  ],
};

/* ═══════════════════════════════════════════════════════
   POST /api/ml/predict-struggle
═══════════════════════════════════════════════════════ */
router.post("/predict-struggle", authMiddleware, async (req, res) => {
  try {
    const { subject, topicScores } = req.body;

    // Normalize subject slug
    const normalizedSubject = slugify(subject || "");

    if (!normalizedSubject || !topicScores) {
      return res.status(400).json({ message: "subject and topicScores are required" });
    }

    const topics = SUBJECT_TOPICS[normalizedSubject];

    if (!topics) {
      console.log(`Unknown subject: "${normalizedSubject}". Available: ${Object.keys(SUBJECT_TOPICS).join(", ")}`);
      // Return empty gracefully instead of 400 — app still works
      return res.json({ predictions: [], reason: "unknown_subject" });
    }

    // Map slug → score
    const titleToScore = {};
    topics.forEach((t) => {
      const slug = slugify(t.title);
      if (topicScores[slug] !== undefined) {
        titleToScore[t.title] = topicScores[slug];
      }
    });

    // Build feature payload for Flask
    const priorScoresInOrder = [];
    const flaskPayload = [];

    topics.forEach((topic, i) => {
      const currentScore = titleToScore[topic.title];
      const prereqScores = topic.prereqs
        .map((p) => titleToScore[p])
        .filter((s) => s !== undefined);

      if (currentScore === undefined && priorScoresInOrder.length > 0) {
        flaskPayload.push({
          title:               topic.title,
          position:            i,
          prereq_count:        topic.prereqs.length,
          prerequisite_scores: prereqScores,
          prior_scores:        [...priorScoresInOrder],
        });
      }

      if (currentScore !== undefined) {
        priorScoresInOrder.push(currentScore);
      }
    });

    if (flaskPayload.length === 0) {
      return res.json({ predictions: [], reason: "not_enough_data" });
    }

    // Wake up ML service before prediction (IMPORTANT)
try {
  await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 10000 });
  console.log("ML service is awake");
} catch (err) {
  console.log("ML wake-up failed (may still continue)");
}

    // Call Flask ML service
    // timeout: 25000 because Render free tier can cold-start in ~15-20s
   // Call Flask ML service with retry (FIXED)
let mlResponse;

for (let i = 0; i < 2; i++) {
  try {
    mlResponse = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      { subject: normalizedSubject, topics: flaskPayload },
      { timeout: 25000, headers: { "Content-Type": "application/json" } }
    );
    break; // success
  } catch (err) {
    console.log(`ML attempt ${i + 1} failed`);
    if (i === 1) throw err; // fail after 2 attempts
  }
}

return res.json({ predictions: mlResponse.data.predictions });
  } catch (err) {
    // Log the real error for debugging in Render logs
    if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT" || err.code === "ECONNABORTED") {
      console.log("ML service unavailable (cold start or down) — returning empty predictions");
    } else {
      console.error("ML route error:", err.response?.data || err.message);
    }
    // Always return gracefully — never break the subject page
    return res.json({
  predictions: Object.entries(topicScores || {})
    .filter(([_, score]) => score <= 30)
    .map(([slug]) => ({
      title: slug.replace(/-/g, " "),
      will_struggle: true,
      confidence: 0.8,
      source: "fallback"
    })),
  reason: "fallback_used"
});
  }
});

module.exports = router;