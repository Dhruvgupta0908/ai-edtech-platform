/**
 * cleanupProgress.js
 *
 * Run this ONCE from your backend folder:
 *   node cleanupProgress.js
 *
 * What it does:
 *   1. Groups all Progress documents by {userId, subject, topic}
 *   2. For each group that has more than 1 document, keeps only
 *      the most recent one and deletes the rest
 *   3. Creates a unique index on {userId, subject, topic} so
 *      duplicates can never accumulate again
 */

const mongoose = require("mongoose");
require("dotenv").config();

const Progress = require("./models/progress");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => { console.error(err); process.exit(1); });

const cleanup = async () => {
  try {

    /* ── 1. Find all duplicate groups ── */
    const duplicates = await Progress.aggregate([
      {
        $group: {
          _id:   { userId: "$userId", subject: "$subject", topic: "$topic" },
          count: { $sum: 1 },
          ids:   { $push: "$_id" },
          /* keep the most recently updated doc */
          latestId: { $last: "$_id" }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    console.log(`Found ${duplicates.length} duplicate group(s)`);

    /* ── 2. For each duplicate group, delete everything except the latest ── */
    let totalDeleted = 0;

    for (const group of duplicates) {
      const idsToDelete = group.ids.filter(
        id => id.toString() !== group.latestId.toString()
      );

      const result = await Progress.deleteMany({ _id: { $in: idsToDelete } });
      totalDeleted += result.deletedCount;

      console.log(
        `  Kept latest for [${group._id.userId} | ${group._id.subject} | ${group._id.topic}]` +
        ` — deleted ${result.deletedCount} duplicate(s)`
      );
    }

    console.log(`\n✅ Cleanup done. Deleted ${totalDeleted} duplicate document(s) total.`);

    /* ── 3. Create a unique index to prevent future duplicates ── */
    await Progress.collection.createIndex(
      { userId: 1, subject: 1, topic: 1 },
      { unique: true, background: true }
    );

    console.log("✅ Unique index created on {userId, subject, topic}");

    /* ── 4. Show what's left so you can verify ── */
    const remaining = await Progress.find({}).lean();
    console.log(`\n📊 Documents remaining in Progress collection: ${remaining.length}`);

    const grouped = {};
    remaining.forEach(doc => {
      const key = doc.subject;
      if (!grouped[key]) grouped[key] = 0;
      grouped[key]++;
    });
    console.log("Breakdown by subject:");
    Object.entries(grouped).forEach(([subject, count]) => {
      console.log(`  ${subject}: ${count} topic(s) recorded`);
    });

  } catch (err) {
    console.error("Cleanup error:", err);
  } finally {
    mongoose.disconnect();
  }
};

cleanup();