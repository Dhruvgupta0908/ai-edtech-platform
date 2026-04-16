const mongoose = require("mongoose");

/* ── Each question answer saved in the attempt ── */
const answerSchema = new mongoose.Schema({
  question:     { type: String },
  options:      [{ type: String }],
  correctIndex: { type: Number },
  chosenIndex:  { type: Number },
  isCorrect:    { type: Boolean }
}, { _id: false });

/* ── Main progress schema ── */
const progressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  section: {
    type: String,
    default: "theory"
  },
  testScore: {
    type: Number,
    default: 0
  },
  lastAttempt: {
    type: [answerSchema],
    default: []
  }
}, {
  timestamps: true
});

/*
  Unique compound index on {userId, subject, topic}.
  This guarantees only ONE Progress document per user per topic,
  so docs.length always equals the exact number of distinct
  topics attempted — never inflated by duplicates.
*/
progressSchema.index(
  { userId: 1, subject: 1, topic: 1 },
  { unique: true }
);

const Progress = mongoose.model("Progress", progressSchema);

module.exports = Progress;