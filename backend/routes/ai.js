// backend/routes/ai.js
// UPDATED — added POST /api/ai/study-plan at the bottom
// All previous routes unchanged.

const express = require("express");
const axios   = require("axios");
require("dotenv").config();

const router = express.Router();


/* =======================================================
   POST /api/ai/ask
======================================================= */
router.post("/ask", async (req, res) => {
  const { topic, question } = req.body;
  if (!question) return res.status(400).json({ error: "Question required" });
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a GATE Computer Science tutor." },
          { role: "user",   content: `Topic: ${topic}\n\nQuestion: ${question}\n\nExplain in:\n1. Simple definition\n2. Key concepts\n3. Example\n4. GATE exam tips\n\nKeep it structured and easy to understand.` }
        ],
        temperature: 0.4, max_tokens: 500
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );
    res.json({ answer: response.data?.choices?.[0]?.message?.content });
  } catch (error) {
    console.error("GROQ ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "AI failed" });
  }
});


/* =======================================================
   POST /api/ai/socratic
======================================================= */
router.post("/socratic", async (req, res) => {
  const { topic, subject, score, mode, context, question, studentAnswer, allOptions } = req.body;
  const systemPrompt = `You are a Socratic CS tutor helping a student prepare for GATE.
Your job is NOT to give the answer directly.
Instead, ask ONE short guiding question that nudges the student to think and discover the answer themselves.
Keep your response to 1-2 sentences maximum. Be encouraging and clear.`;
  let userPrompt = "";
  if (mode === "topic_review") {
    userPrompt = `The student is studying "${topic}" in "${subject}".\nScore: ${score}%.\n${context || ""}\nAsk ONE Socratic guiding question. Do NOT reveal the answer.`;
  } else if (mode === "follow_up") {
    userPrompt = `The student is studying "${topic}" in "${subject}".\n${context || ""}\nAsk ONE short follow-up Socratic question or briefly confirm if their thinking is correct.`;
  } else if (mode === "wrong_answer") {
    userPrompt = `Student answered "${topic}" incorrectly.\nQuestion: ${question}\nStudent's answer: ${studentAnswer}\nOptions: ${Array.isArray(allOptions) ? allOptions.join(", ") : allOptions}\n${context || ""}\nAsk ONE Socratic question guiding toward correct concept.`;
  } else {
    userPrompt = `Student needs help with "${topic}" in "${subject}".\n${context || ""}\nAsk ONE short Socratic guiding question.`;
  }
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt   }
        ],
        temperature: 0.5, max_tokens: 150
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );
    const tutorQuestion = response.data?.choices?.[0]?.message?.content?.trim();
    if (!tutorQuestion) return res.status(500).json({ error: "Empty response from AI" });
    res.json({ tutorQuestion });
  } catch (error) {
    console.error("SOCRATIC GROQ ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "AI tutor failed" });
  }
});


/* =======================================================
   POST /api/ai/explain-mistake
======================================================= */
router.post("/explain-mistake", async (req, res) => {
  const { topic, subject, question, chosenOption, correctOption, allOptions } = req.body;
  if (!question || !chosenOption || !correctOption) {
    return res.status(400).json({ error: "question, chosenOption and correctOption are required" });
  }
  const systemPrompt = `You are an expert GATE CS tutor. A student answered an MCQ incorrectly.
Give a clear, concise explanation in exactly 3 short sections. Be direct and educational.`;
  const userPrompt = `Topic: ${topic}\nSubject: ${subject}\nQuestion: ${question}\nOptions:\n${allOptions.map((o, i) => `${String.fromCharCode(65+i)}. ${o}`).join("\n")}\nStudent chose: "${chosenOption}"\nCorrect: "${correctOption}"\n\n**Why your answer was wrong:**\n[1-2 sentences]\n\n**Why the correct answer is right:**\n[1-2 sentences]\n\n**Key concept to remember:**\n[1 sentence]\n\nUnder 120 words total.`;
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt   }
        ],
        temperature: 0.3, max_tokens: 250
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );
    const explanation = response.data?.choices?.[0]?.message?.content?.trim();
    if (!explanation) return res.status(500).json({ error: "Empty response from AI" });
    res.json({ explanation });
  } catch (error) {
    console.error("EXPLAIN-MISTAKE GROQ ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "AI explanation failed" });
  }
});


/* =======================================================
   POST /api/ai/generate-questions
======================================================= */
router.post("/generate-questions", async (req, res) => {
  const { topic, subject, theory, existingQs = [], count = 5, difficulty = "normal" } = req.body;
  if (!topic || !subject) return res.status(400).json({ error: "topic and subject are required" });
  const isAdvanced = difficulty === "advanced";
  const systemPrompt = `You are an expert GATE CS question setter.
Generate MCQs that are clear, technically accurate, and exam-focused.
Respond with ONLY a valid JSON array — no explanation, no markdown, no backticks.
Each object: { "question": string, "options": [4 strings], "correctAnswer": number 0-3 }`;
  const existingList = existingQs.length > 0 ? `\nDo NOT repeat:\n${existingQs.map((q,i)=>`${i+1}. ${q}`).join("\n")}` : "";
  const diffInstructions = isAdvanced
    ? "\nADVANCED: application-level, multi-step reasoning, plausible trap options, GATE PYQ style. No basic definitions."
    : "\nStandard: test a specific concept, 4 options, one correct answer.";
  const userPrompt = `Topic: ${topic}\nSubject: ${subject}\nTheory:\n${theory ? theory.slice(0,800) : ""}${existingList}${diffInstructions}\n\nGenerate exactly ${count} questions as JSON array only.`;
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt   }
        ],
        temperature: isAdvanced ? 0.6 : 0.7, max_tokens: 1200
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );
    const raw = response.data?.choices?.[0]?.message?.content?.trim();
    if (!raw) return res.status(500).json({ error: "Empty response from AI" });
    const cleaned = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
    let questions;
    try { questions = JSON.parse(cleaned); }
    catch { return res.status(500).json({ error: "AI returned invalid JSON" }); }
    if (!Array.isArray(questions)) return res.status(500).json({ error: "AI response was not an array" });
    const valid = questions.filter(q =>
      q.question && Array.isArray(q.options) && q.options.length === 4 &&
      typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer <= 3
    );
    if (valid.length === 0) return res.status(500).json({ error: "No valid questions generated" });
    res.json({ questions: valid });
  } catch (error) {
    console.error("GENERATE-QUESTIONS GROQ ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "Question generation failed" });
  }
});


/* =======================================================
   POST /api/ai/study-plan
   ── NEW ROUTE ──

   Generates a personalised day-wise AI study plan based on
   the student's weak topics (score < 40%) and not-started topics.

   Body:
     weakTopics  : [{ subject, topic, score }]
     notStarted  : [{ subject, topic }]
     targetDays  : 7 | 14 | 30
     examGoal    : string  e.g. "GATE 2026"

   Returns:
     { plan: [{ day, tasks: [{ subject, topic, activity, duration }], tip }] }
======================================================= */
router.post("/study-plan", async (req, res) => {
  const { weakTopics = [], notStarted = [], targetDays = 14, examGoal = "GATE" } = req.body;

  if (weakTopics.length === 0 && notStarted.length === 0) {
    return res.status(400).json({ error: "No topics provided. Attempt some tests first to generate a personalised plan." });
  }

  const systemPrompt = `You are an expert GATE Computer Science study planner.
Create a structured, realistic, day-wise study plan for a student.
Respond with ONLY a valid JSON array — no explanation, no markdown, no backticks.
Each element is one day with exactly these fields:
  "day"   : number (1 to ${targetDays})
  "tasks" : array of 2-3 objects, each with:
              "subject"  : string
              "topic"    : string
              "activity" : one of: "Read theory", "Watch video", "Practice quiz", "Revise notes", "Attempt test", "Solve problems"
              "duration" : string e.g. "45 mins" or "1 hour"
  "tip"   : string — one short motivational or study tip, max 12 words`;

  const weakList = weakTopics.length > 0
    ? weakTopics.map(t => `- ${t.topic} (${t.subject}) — score: ${t.score}%`).join("\n")
    : "None";

  const notStartedList = notStarted.length > 0
    ? notStarted.slice(0, 15).map(t => `- ${t.topic} (${t.subject})`).join("\n")
    : "None";

  const userPrompt = `Create a ${targetDays}-day study plan for ${examGoal} preparation.

WEAK TOPICS — must be revised AND retested (score < 40%):
${weakList}

NOT STARTED TOPICS — must be covered from scratch:
${notStartedList}

Rules:
1. Prioritise weak topics — revise first, then retest later in the plan
2. Each weak topic must appear at least TWICE (once theory, once test)
3. Spread not-started topics evenly across available days
4. Each day: 2-3 tasks, total 2-3 hours max — keep it realistic
5. Every 5-6 days include a lighter revision day
6. Final 2 days: full revision + mock test
7. Vary activities — mix theory, practice, and testing

Respond with ONLY the JSON array of ${targetDays} day objects:`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model:    "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt   }
        ],
        temperature: 0.4,
        max_tokens:  3000
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );

    const raw = response.data?.choices?.[0]?.message?.content?.trim();
    if (!raw) return res.status(500).json({ error: "Empty response from AI" });

    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let plan;
    try {
      plan = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Study plan JSON parse error:", parseErr.message);
      return res.status(500).json({ error: "AI returned invalid JSON — try again" });
    }

    if (!Array.isArray(plan)) {
      return res.status(500).json({ error: "AI response was not an array" });
    }

    res.json({ plan });

  } catch (error) {
    console.error("STUDY-PLAN GROQ ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "Study plan generation failed" });
  }
});


module.exports = router;