const router = require("express").Router();
const quizController = require("../controllers/quizController");

// Create quiz
router.post("/", quizController.createQuiz);

// Add questions
router.post("/:id/questions", quizController.addQuestions);

// Publish quiz
router.put("/:id/publish", quizController.publishQuiz);

// Get quizzes
router.get("/", quizController.getQuizzes);

// Get quiz
router.get("/:id", quizController.getQuizById);

// Submit quiz
router.post("/:id/submit", quizController.submitQuiz);

// Teacher dashboard
router.get("/:id/attempts", quizController.getAttempts);

module.exports = router;