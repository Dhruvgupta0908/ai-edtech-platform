const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: Number
});

const topicSchema = new mongoose.Schema({
  subject: String,
  title: String,
  theory: String,
  videos: [String],
  questions: [questionSchema]
});

module.exports = mongoose.model("Topic", topicSchema);
