// backend/models/pyq.js
// PYQ — Previous Year Questions model
// Each document = one PYQ for one topic

const mongoose = require("mongoose");

const pyqSchema = new mongoose.Schema({
  subject:     { type: String, required: true },   // e.g. "operating-systems"
  topic:       { type: String, required: true },   // e.g. "deadlocks" (slug)
  year:        { type: Number, required: true },   // e.g. 2023
  question:    { type: String, required: true },
  options:     [{ type: String }],                 // 4 options
  correctAnswer: { type: Number, required: true }, // index 0-3
  explanation: { type: String, default: "" },      // why the answer is correct
  marks:       { type: Number, default: 2 },       // 1 or 2 marks
  pyqLink:     { type: String, default: "" },      // official GATE PDF link (add later)
}, { timestamps: true });

pyqSchema.index({ subject: 1, topic: 1 });
pyqSchema.index({ subject: 1, topic: 1, year: 1 });

module.exports = mongoose.model("PYQ", pyqSchema);