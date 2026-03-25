require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { connectDB } = require("./config/db");
const routes = require("./routes");
const { helmetMiddleware, generalLimiter, authLimiter } = require("./middleware/security");

const {
  User,
  Subject,
  Material,
  Question,
  QuestionAttempt,
  Test,
  TestQuestion,
  TestAttempt,
  Roadmap,
  RoadmapProgress,
  Bookmark,
  Announcement,
  Contest,
  ContestSubmission,
  Note,
  NoteFolder,
  FeatureFlag,

  // 🔥 ADD THESE (IMPORTANT)
  Quiz,
  QuizQuestion,
  Attempt,

} = require("./models");

const app = express();

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const corsOrigins = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: corsOrigins.split(","), credentials: true }));
app.use(helmetMiddleware);
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

app.use(generalLimiter);

app.get("/", (req, res) => res.json({ message: "CoachCode.ai API", version: "2.0" }));

app.use("/api/auth", authLimiter);
app.use("/api", routes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

// 🔥 FIXED SYNC MODELS
const syncModels = async () => {
  const models = [
    User,
    Subject,
    Material,
    Question,
    QuestionAttempt,
    Test,
    TestQuestion,
    TestAttempt,
    Roadmap,
    RoadmapProgress,
    Bookmark,
    Announcement,
    Contest,
    ContestSubmission,
    Note,
    NoteFolder,
    FeatureFlag,

    // 🔥 MOST IMPORTANT
    Quiz,
    QuizQuestion,
    Attempt,
  ];

  for (const M of models) {
    await M.sync({ alter: true });
  }

  console.log("All tables synced");
};

// Start server
connectDB()
  .then(() => syncModels())
  .then(() =>
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    )
  )
  .catch((err) => {
    console.error("Startup failed:", err);
    process.exit(1);
  });