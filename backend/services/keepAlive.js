// backend/services/keepAlive.js
// Pings the Flask ML service every 10 minutes so Render never spins it down.
// Call startKeepAlive() once in server.js after MongoDB connects.

const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "https://ai-edtech-platform-2.onrender.com";
const PING_INTERVAL  = 10 * 60 * 1000; // 10 minutes in ms

function startKeepAlive() {
  console.log(`🏓 Keep-alive started — pinging ML service every 10 minutes`);

  setInterval(async () => {
    try {
      const res = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 10000 });
      console.log(`🏓 ML service ping OK — model loaded: ${res.data.model_loaded}`);
    } catch (err) {
      console.log(`🏓 ML service ping failed (may be waking up): ${err.message}`);
    }
  }, PING_INTERVAL);
}

module.exports = { startKeepAlive };