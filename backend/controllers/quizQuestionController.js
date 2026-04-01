const { Quiz, QuizQuestion } = require("../models");

const validateQuestion = (q, idx) => {
  if (!q?.questionText || !String(q.questionText).trim()) return `Question ${idx + 1}: text is required.`;
  if (!Array.isArray(q.options) || q.options.length !== 4) return `Question ${idx + 1}: exactly 4 options required.`;
  if (q.options.some((o) => !String(o).trim())) return `Question ${idx + 1}: options cannot be empty.`;
  if (![0, 1, 2, 3].includes(Number(q.correctAnswer))) return `Question ${idx + 1}: correct answer must be A/B/C/D.`;
  return null;
};

exports.replaceQuestions = async (req, res) => {
  try {
    const quizId = parseInt(req.params.id, 10);
    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found." });

    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length < 1) {
      return res.status(400).json({ success: false, message: "Minimum one question is required." });
    }
    for (let i = 0; i < questions.length; i += 1) {
      const err = validateQuestion(questions[i], i);
      if (err) return res.status(400).json({ success: false, message: err });
    }

    await QuizQuestion.destroy({ where: { quizId } });
    await QuizQuestion.bulkCreate(
      questions.map((q) => ({
        quizId,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: Number(q.correctAnswer),
        difficulty: q.difficulty || "medium",
      }))
    );
    quiz.status = "draft";
    quiz.isPublished = false;
    await quiz.save();
    return res.json({ success: true, message: "Questions updated." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
