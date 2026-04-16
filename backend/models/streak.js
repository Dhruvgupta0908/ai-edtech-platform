const mongoose = require("mongoose");

const streakSchema = new mongoose.Schema({
  userId: {
    type:     String,
    required: true,
    unique:   true
  },
  currentStreak: {
    type:    Number,
    default: 0
  },
  longestStreak: {
    type:    Number,
    default: 0
  },
  lastStudyDate: {
    type:    String,
    default: null
  },
  /* Stores the last 30 actual study dates as "YYYY-MM-DD" strings.
     Used to accurately render the 7-day activity dots on the dashboard.
     We only keep 30 days to avoid unbounded growth.               */
  studyDates: {
    type:    [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("Streak", streakSchema);