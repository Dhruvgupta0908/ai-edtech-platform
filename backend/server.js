// backend/server.js
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
require("dotenv").config();

const { startKeepAlive } = require("./services/keepAlive");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth",      require("./routes/auth"));
app.use("/api/topics",    require("./routes/topics"));
app.use("/api/ai",        require("./routes/ai"));
app.use("/api/progress",  require("./routes/progress"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/streak",    require("./routes/streak"));
app.use("/api/ml",        require("./routes/ml"));

app.get("/", (req, res) => res.send("CoreMind AI backend running 🚀"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} 🚀`);
      startKeepAlive();
    });
  })
  .catch(err => console.log(err));