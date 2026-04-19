// backend/routes/ai.js — FINAL (6 routes including /summarise)
const express = require("express");
const axios   = require("axios");
require("dotenv").config();
const router = express.Router();
const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";
const groqHeaders = () => ({ Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" });

/* 1. ASK */
router.post("/ask", async (req, res) => {
  const { topic, question } = req.body;
  if (!question) return res.status(400).json({ error: "Question required" });
  try {
    const r = await axios.post(GROQ_URL, { model: GROQ_MODEL, messages: [{ role: "system", content: "You are a GATE Computer Science tutor." }, { role: "user", content: `Topic: ${topic}\n\nQuestion: ${question}\n\nExplain in:\n1. Simple definition\n2. Key concepts\n3. Example\n4. GATE exam tips\n\nKeep it structured and easy to understand.` }], temperature: 0.4, max_tokens: 500 }, { headers: groqHeaders() });
    res.json({ answer: r.data?.choices?.[0]?.message?.content });
  } catch (e) { console.error("ask error:", e.message); res.status(500).json({ error: "AI failed" }); }
});

/* 2. SOCRATIC */
router.post("/socratic", async (req, res) => {
  const { topic, subject, score, mode, context, question, studentAnswer, allOptions } = req.body;
  const sys = `You are a Socratic CS tutor helping a student prepare for GATE. Your job is NOT to give the answer directly. Instead, ask ONE short guiding question that nudges the student to think and discover the answer themselves. Keep your response to 1-2 sentences maximum. Be encouraging and clear.`;
  let usr = "";
  if (mode === "topic_review") usr = `The student is studying "${topic}" in "${subject}".\nScore: ${score}%.\n${context||""}\nAsk ONE Socratic guiding question. Do NOT reveal the answer.`;
  else if (mode === "follow_up") usr = `The student is studying "${topic}" in "${subject}".\n${context||""}\nAsk ONE short follow-up Socratic question or briefly confirm if their thinking is correct.`;
  else if (mode === "wrong_answer") usr = `Student answered "${topic}" incorrectly.\nQuestion: ${question}\nStudent's answer: ${studentAnswer}\nOptions: ${Array.isArray(allOptions)?allOptions.join(", "):allOptions}\n${context||""}\nAsk ONE Socratic question guiding toward correct concept.`;
  else usr = `Student needs help with "${topic}" in "${subject}".\n${context||""}\nAsk ONE short Socratic guiding question.`;
  try {
    const r = await axios.post(GROQ_URL, { model: GROQ_MODEL, messages: [{ role: "system", content: sys }, { role: "user", content: usr }], temperature: 0.5, max_tokens: 150 }, { headers: groqHeaders() });
    const tutorQuestion = r.data?.choices?.[0]?.message?.content?.trim();
    if (!tutorQuestion) return res.status(500).json({ error: "Empty response" });
    res.json({ tutorQuestion });
  } catch (e) { console.error("socratic error:", e.message); res.status(500).json({ error: "AI tutor failed" }); }
});

/* 3. EXPLAIN-MISTAKE */
router.post("/explain-mistake", async (req, res) => {
  const { topic, subject, question, chosenOption, correctOption, allOptions } = req.body;
  if (!question || !chosenOption || !correctOption) return res.status(400).json({ error: "Missing fields" });
  try {
    const r = await axios.post(GROQ_URL, { model: GROQ_MODEL, messages: [{ role: "system", content: `You are an expert GATE CS tutor. A student answered an MCQ incorrectly. Give a clear, concise explanation in exactly 3 short sections. Be direct and educational.` }, { role: "user", content: `Topic: ${topic}\nSubject: ${subject}\nQuestion: ${question}\nOptions:\n${allOptions.map((o,i)=>`${String.fromCharCode(65+i)}. ${o}`).join("\n")}\nStudent chose: "${chosenOption}"\nCorrect: "${correctOption}"\n\n**Why your answer was wrong:**\n[1-2 sentences]\n\n**Why the correct answer is right:**\n[1-2 sentences]\n\n**Key concept to remember:**\n[1 sentence]\n\nUnder 120 words total.` }], temperature: 0.3, max_tokens: 250 }, { headers: groqHeaders() });
    const explanation = r.data?.choices?.[0]?.message?.content?.trim();
    if (!explanation) return res.status(500).json({ error: "Empty response" });
    res.json({ explanation });
  } catch (e) { console.error("explain-mistake error:", e.message); res.status(500).json({ error: "AI explanation failed" }); }
});

/* 4. GENERATE-QUESTIONS */
router.post("/generate-questions", async (req, res) => {
  const { topic, subject, theory, existingQs = [], count = 5, difficulty = "normal" } = req.body;
  if (!topic || !subject) return res.status(400).json({ error: "topic and subject required" });
  const isAdv = difficulty === "advanced";
  const sys = `You are an expert GATE CS question setter. Generate MCQs that are clear, technically accurate, and exam-focused. Respond with ONLY a valid JSON array — no explanation, no markdown, no backticks. Each object: { "question": string, "options": [4 strings], "correctAnswer": number 0-3 }`;
  const existingList = existingQs.length > 0 ? `\nDo NOT repeat:\n${existingQs.map((q,i)=>`${i+1}. ${q}`).join("\n")}` : "";
  const diffInstr = isAdv ? "\nADVANCED: application-level, multi-step reasoning, plausible trap options, GATE PYQ style. No basic definitions." : "\nStandard: test a specific concept, 4 options, one correct answer.";
  const usr = `Topic: ${topic}\nSubject: ${subject}\nTheory:\n${theory?theory.slice(0,800):""}${existingList}${diffInstr}\n\nGenerate exactly ${count} questions as JSON array only.`;
  try {
    const r = await axios.post(GROQ_URL, { model: GROQ_MODEL, messages: [{ role: "system", content: sys }, { role: "user", content: usr }], temperature: isAdv?0.6:0.7, max_tokens: 1200 }, { headers: groqHeaders() });
    const raw = r.data?.choices?.[0]?.message?.content?.trim();
    if (!raw) return res.status(500).json({ error: "Empty response" });
    const cleaned = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
    let questions; try { questions = JSON.parse(cleaned); } catch { return res.status(500).json({ error: "Invalid JSON" }); }
    if (!Array.isArray(questions)) return res.status(500).json({ error: "Not an array" });
    const valid = questions.filter(q => q.question && Array.isArray(q.options) && q.options.length===4 && typeof q.correctAnswer==="number" && q.correctAnswer>=0 && q.correctAnswer<=3);
    if (valid.length === 0) return res.status(500).json({ error: "No valid questions" });
    res.json({ questions: valid });
  } catch (e) { console.error("generate-questions error:", e.message); res.status(500).json({ error: "Question generation failed" }); }
});

/* 5. STUDY-PLAN */
router.post("/study-plan", async (req, res) => {
  const { weakTopics=[], notStarted=[], targetDays=14, examGoal="GATE" } = req.body;
  if (weakTopics.length===0 && notStarted.length===0) return res.status(400).json({ error: "No topics provided" });
  const sys = `You are an expert GATE Computer Science study planner. Create a structured, realistic, day-wise study plan for a student. Respond with ONLY a valid JSON array — no explanation, no markdown, no backticks. Each element is one day with exactly these fields: "day": number (1 to ${targetDays}), "tasks": array of 2-3 objects each with "subject": string, "topic": string, "activity": one of: "Read theory","Watch video","Practice quiz","Revise notes","Attempt test","Solve problems", "duration": string e.g. "45 mins" or "1 hour", "tip": string — one short motivational or study tip max 12 words`;
  const weakList = weakTopics.length>0 ? weakTopics.map(t=>`- ${t.topic} (${t.subject}) — score: ${t.score}%`).join("\n") : "None";
  const notStartedList = notStarted.length>0 ? notStarted.slice(0,15).map(t=>`- ${t.topic} (${t.subject})`).join("\n") : "None";
  const usr = `Create a ${targetDays}-day study plan for ${examGoal} preparation.\n\nWEAK TOPICS — must be revised AND retested (score < 40%):\n${weakList}\n\nNOT STARTED TOPICS — must be covered from scratch:\n${notStartedList}\n\nRules:\n1. Prioritise weak topics — revise first, then retest later\n2. Each weak topic must appear at least TWICE\n3. Spread not-started topics evenly\n4. Each day: 2-3 tasks, total 2-3 hours max\n5. Every 5-6 days include a lighter revision day\n6. Final 2 days: full revision + mock test\n7. Vary activities\n\nRespond with ONLY the JSON array of ${targetDays} day objects:`;
  try {
    const r = await axios.post(GROQ_URL, { model: GROQ_MODEL, messages: [{ role: "system", content: sys }, { role: "user", content: usr }], temperature: 0.4, max_tokens: 3000 }, { headers: groqHeaders() });
    const raw = r.data?.choices?.[0]?.message?.content?.trim();
    if (!raw) return res.status(500).json({ error: "Empty response" });
    const cleaned = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
    let plan; try { plan = JSON.parse(cleaned); } catch (parseErr) { return res.status(500).json({ error: "Invalid JSON" }); }
    if (!Array.isArray(plan)) return res.status(500).json({ error: "Not an array" });
    res.json({ plan });
  } catch (e) { console.error("study-plan error:", e.message); res.status(500).json({ error: "Study plan generation failed" }); }
});

/* 6. SUMMARISE — NEW 7th AI Feature */
router.post("/summarise", async (req, res) => {
  const { topic, subject, theory } = req.body;
  if (!topic || !theory) return res.status(400).json({ error: "topic and theory are required" });
  try {
    const r = await axios.post(GROQ_URL, { model: GROQ_MODEL, messages: [{ role: "system", content: `You are a GATE CS expert. Summarise a topic into exactly 5 bullet points. Each point must be one clear sentence, technically accurate, and exam-focused. Format: return ONLY a JSON array of 5 strings. No explanation, no markdown, no backticks. Example: ["Point 1.", "Point 2.", "Point 3.", "Point 4.", "Point 5."]` }, { role: "user", content: `Topic: ${topic}\nSubject: ${subject}\nTheory:\n${theory.slice(0,1000)}\n\nReturn a JSON array of exactly 5 key points a GATE student must remember about this topic.` }], temperature: 0.3, max_tokens: 400 }, { headers: groqHeaders() });
    const raw = r.data?.choices?.[0]?.message?.content?.trim();
    const cleaned = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
    let points; try { points = JSON.parse(cleaned); } catch { return res.status(500).json({ error: "Invalid JSON" }); }
    if (!Array.isArray(points)) return res.status(500).json({ error: "Expected array" });
    res.json({ points: points.slice(0, 5) });
  } catch (e) { console.error("summarise error:", e.message); res.status(500).json({ error: "Summarisation failed" }); }
});

module.exports = router;