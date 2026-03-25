const { Quiz, QuizQuestion, Attempt, User } = require("../models");

// ✅ Create Quiz
exports.createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create({
      title: req.body.title,
      description: req.body.description,
      subjectId: req.body.subjectId,
      createdBy: req.user?.id || null,
    });

    res.json({ success: true, data: quiz });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Add Questions
exports.addQuestions = async (req, res) => {
  try {
    const { questions } = req.body;

    const data = questions.map(q => ({
      quizId: req.params.id,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));

    await QuizQuestion.bulkCreate(data);

    res.json({ success: true, message: "Questions added" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Publish Quiz
exports.publishQuiz = async (req, res) => {
  try {
    await Quiz.update(
      { isPublished: true },
      { where: { id: req.params.id } }
    );

    res.json({ success: true, message: "Quiz published" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get all quizzes (Student)
exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({
      where: { isPublished: true },
    });

    res.json({ success: true, data: quizzes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get single quiz with questions
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: QuizQuestion,
    });

    res.json({ success: true, data: quiz });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Submit Quiz
exports.submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;

    const questions = await QuizQuestion.findAll({
      where: { quizId: req.params.id },
    });

    let score = 0;

    const result = questions.map(q => {
      const selected = answers[q.id];
      const isCorrect = selected === q.correctAnswer;

      if (isCorrect) score++;

      return {
        questionId: q.id,
        correctAnswer: q.correctAnswer,
        selected,
        isCorrect,
      };
    });

    await Attempt.create({
      quizId: req.params.id,
      studentId: req.user?.id || 1,
      answers,
      score,
    });

    res.json({
      success: true,
      score,
      total: questions.length,
      result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Teacher Dashboard
exports.getAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.findAll({
      where: { quizId: req.params.id },
      include: [{ model: User, attributes: ["id", "name", "email"] }],
    });

    res.json({ success: true, data: attempts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};