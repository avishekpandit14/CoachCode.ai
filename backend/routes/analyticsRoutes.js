const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { authenticate, requireRole } = require("../middleware/auth");

router.get("/dashboard", authenticate, requireRole(["admin", "faculty"]), analyticsController.dashboard);
router.get("/weekly", authenticate, requireRole(["admin", "faculty"]), analyticsController.weeklyGrowth);
router.get("/student/dashboard", authenticate, requireRole(["student"]), analyticsController.studentDashboard);

module.exports = router;
