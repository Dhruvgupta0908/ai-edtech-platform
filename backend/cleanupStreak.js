/**
 * cleanupStreak.js
 * Run ONCE from your backend folder:
 *   node cleanupStreak.js
 *
 * Deletes all Streak documents so they recreate
 * correctly the next time a test is completed.
 */

const mongoose = require("mongoose");
require("dotenv").config();

const Streak = require("./models/streak");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => { console.error(err); process.exit(1); });

const cleanup = async () => {
  try {

    const result = await Streak.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} Streak document(s)`);
    console.log("Now complete any test — streak will start fresh from 1");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    mongoose.disconnect();
  }
};

cleanup();