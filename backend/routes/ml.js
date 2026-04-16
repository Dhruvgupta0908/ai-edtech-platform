// backend/routes/ml.js
// Proxy route: Node.js calls Flask ML service on behalf of the frontend.
// React never calls Flask directly — Node acts as the middleman.
//
// POST /api/ml/predict-struggle
// Protected — JWT required.

const express        = require("express");
const axios          = require("axios");
const router         = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

// Topic structure mirrors your SubjectsData.js
// Used server-side to build the feature payload for Flask
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
    { title: "Code Optimization",               prereqs: ["Intermediate Code Generation"] },
    { title: "Code Generation",                 prereqs: ["Code Optimization"] },
    { title: "Symbol Table",                    prereqs: ["Semantic Analysis"] },
    { title: "Runtime Environment",             prereqs: ["Code Generation"] },
  ],
  "discrete-mathematics": [
    { title: "Propositional Logic",        prereqs: [] },
    { title: "Predicate Logic",            prereqs: ["Propositional Logic"] },
    { title: "Set Theory",                 prereqs: ["Predicate Logic"] },
    { title: "Relations and Functions",    prereqs: ["Set Theory"] },
    { title: "Mathematical Induction",     prereqs: ["Relations and Functions"] },
    { title: "Combinatorics",              prereqs: ["Mathematical Induction"] },
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
   Body: { subject: "operating-systems", topicScores: { "process-concept": 45, ... } }
   topicScores keys are slugified topic titles, values are 0-100 scores.
   Returns ML predictions for topics NOT YET attempted.
═══════════════════════════════════════════════════════ */
router.post("/predict-struggle", authMiddleware, async (req, res) => {
  try {
    const { subject, topicScores } = req.body;

    if (!subject || !topicScores) {
      return res.status(400).json({ message: "subject and topicScores are required" });
    }

    const topics = SUBJECT_TOPICS[subject];
    if (!topics) {
      return res.status(400).json({ message: `Unknown subject: ${subject}` });
    }

    // ── Build a title → score map from slug-keyed input ──
    // topicScores from frontend uses slugs; we need to match titles
    const slugify = (text) =>
      text.toLowerCase()
        .replace(/\//g, "-").replace(/&/g, "-")
        .replace(/\s+/g, "-").replace(/[^\w-]/g, "")
        .replace(/--+/g, "-");

    const titleToScore = {};
    topics.forEach(t => {
      const slug = slugify(t.title);
      if (topicScores[slug] !== undefined) {
        titleToScore[t.title] = topicScores[slug];
      }
    });

    // ── Build feature payload for Flask ──
    // Only predict for topics that have at least one prerequisite scored
    // (no data = can't predict meaningfully)
    const priorScoresInOrder = [];
    const flaskPayload = [];

    topics.forEach((topic, i) => {
      const currentScore = titleToScore[topic.title];
      const prereqScores = topic.prereqs
        .map(p => titleToScore[p])
        .filter(s => s !== undefined);

      // If this topic hasn't been attempted and we have some prior data → predict
      if (currentScore === undefined && priorScoresInOrder.length > 0) {
        flaskPayload.push({
          title:              topic.title,
          position:           i,
          prereq_count:       topic.prereqs.length,
          prerequisite_scores: prereqScores,
          prior_scores:       [...priorScoresInOrder],
        });
      }

      // Always add current score to prior history if attempted
      if (currentScore !== undefined) {
        priorScoresInOrder.push(currentScore);
      }
    });

    // If student hasn't attempted anything yet, skip ML
    if (flaskPayload.length === 0) {
      return res.json({ predictions: [], reason: "not_enough_data" });
    }

    // ── Call Flask ML service ──
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
      subject,
      topics: flaskPayload,
    }, { timeout: 5000 });

    res.json({ predictions: mlResponse.data.predictions });

  } catch (err) {
    // If Flask is down, gracefully return empty predictions
    if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
      console.log("ML service unavailable — returning empty predictions");
      return res.json({ predictions: [], reason: "ml_service_unavailable" });
    }
    console.error("ML route error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;