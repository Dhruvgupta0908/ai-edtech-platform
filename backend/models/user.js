const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  // NEW: Track progress per subject to drive the adaptive path
  progress: [{
    subjectId: { type: String }, // e.g., "operating-systems"
    completedTopics: [String]    // e.g., ["Introduction to Operating Systems"]
  }]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);