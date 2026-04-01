const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const subjectRoutes = require("./subjectRoutes");
const materialRoutes = require("./materialRoutes");
const questionRoutes = require("./questionRoutes");
const testRoutes = require("./testRoutes");
const roadmapRoutes = require("./roadmapRoutes");
const bookmarkRoutes = require("./bookmarkRoutes");
const announcementRoutes = require("./announcementRoutes");
const contestRoutes = require("./contestRoutes");
const noteRoutes = require("./noteRoutes");
const compilerRoutes = require("./compilerRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const quizRoutes = require("./quizRoutes");
const testCaseRoutes = require("./testCaseRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/compiler", compilerRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/users", userRoutes);
router.use("/subjects", subjectRoutes);
router.use("/materials", materialRoutes);
router.use("/questions", questionRoutes);
router.use("/tests", testRoutes);
router.use("/roadmap", roadmapRoutes);
router.use("/bookmarks", bookmarkRoutes);
router.use("/announcements", announcementRoutes);
router.use("/contests", contestRoutes);
router.use("/notes", noteRoutes);
router.use("/quizzes", quizRoutes);
router.use("/testcases", testCaseRoutes);

module.exports = router;