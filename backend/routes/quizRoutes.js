const router = require("express").Router();
const quizController = require("../controllers/quizController");
const quizQuestionController = require("../controllers/quizQuestionController");
const quizAttemptController = require("../controllers/quizAttemptController");
const { authenticate, requireRole } = require("../middleware/auth");

// Quiz CRUD
router.post("/", authenticate, requireRole(["admin", "faculty"]), quizController.createQuiz);
router.put("/:id", authenticate, requireRole(["admin", "faculty"]), quizController.updateQuiz);
router.put("/:id/publish", authenticate, requireRole(["admin", "faculty"]), quizController.publishQuiz);
router.delete("/:id", authenticate, requireRole(["admin", "faculty"]), quizController.deleteQuiz);

// Quiz list/details
router.get("/", authenticate, quizController.getQuizzes);
router.get("/:id", authenticate, quizController.getQuizById);

// Question management
router.put("/:id/questions", authenticate, requireRole(["admin", "faculty"]), quizQuestionController.replaceQuestions);

// Attempt flow
router.post("/:id/attempt", authenticate, requireRole(["student"]), quizAttemptController.startAttempt);
router.put("/:id/attempt/:attemptId/autosave", authenticate, requireRole(["student"]), quizAttemptController.autoSaveAttempt);
router.post("/:id/submit", authenticate, requireRole(["student"]), quizAttemptController.submitQuiz);

// Faculty analytics
router.get("/:id/attempts", authenticate, requireRole(["admin", "faculty"]), quizAttemptController.getAttempts);

module.exports = router;