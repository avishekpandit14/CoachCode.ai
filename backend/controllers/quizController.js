const { Quiz, QuizQuestion, Attempt, Subject, User, sequelize } = require("../models");

const validateQuizPayload = ({ title, subjectId, durationMinutes }) => {
  if (!title || !String(title).trim()) return "Quiz title is required.";
  if (!subjectId) return "Subject is required.";
  if (!durationMinutes || Number(durationMinutes) < 1) return "Duration must be at least 1 minute.";
  return null;
};

exports.createQuiz = async (req, res) => {
  try {
    const err = validateQuizPayload(req.body);
    if (err) return res.status(400).json({ success: false, message: err });

    const quiz = await Quiz.create({
      title: String(req.body.title).trim(),
      description: req.body.description || "",
      subjectId: parseInt(req.body.subjectId, 10),
      durationMinutes: parseInt(req.body.durationMinutes, 10),
      allowMultipleAttempts: req.body.allowMultipleAttempts !== false,
      randomizeQuestions: req.body.randomizeQuestions === true,
      randomizeOptions: req.body.randomizeOptions === true,
      createdBy: req.user.id,
      isPublished: false,
      status: "draft",
    });
    return res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found." });

    const fields = ["title", "description", "durationMinutes", "allowMultipleAttempts", "randomizeQuestions", "randomizeOptions", "status"];
    for (const key of fields) {
      if (req.body[key] !== undefined) quiz[key] = req.body[key];
    }
    if (req.body.subjectId !== undefined) quiz.subjectId = parseInt(req.body.subjectId, 10);
    if (quiz.status === "published") quiz.isPublished = true;
    if (quiz.status !== "published") quiz.isPublished = false;
    await quiz.save();
    return res.json({ success: true, data: quiz });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.publishQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, { include: [QuizQuestion] });
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found." });
    if (!quiz.QuizQuestions?.length) {
      return res.status(400).json({ success: false, message: "Add at least one question before publishing." });
    }
    quiz.status = "published";
    quiz.isPublished = true;
    await quiz.save();
    return res.json({ success: true, message: "Quiz published.", data: quiz });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  const txn = await sequelize.transaction();
  try {
    const quizId = parseInt(req.params.id, 10);
    const quiz = await Quiz.findByPk(quizId, { transaction: txn });
    if (!quiz) {
      await txn.rollback();
      return res.status(404).json({ success: false, message: "Quiz not found." });
    }
    await Attempt.destroy({ where: { quizId }, transaction: txn });
    await QuizQuestion.destroy({ where: { quizId }, transaction: txn });
    await quiz.destroy({ transaction: txn });
    await txn.commit();
    return res.json({ success: true, message: "Quiz deleted successfully." });
  } catch (error) {
    await txn.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getQuizzes = async (req, res) => {
  try {
    const isStaff = req.user.role === "admin" || req.user.role === "faculty";
    const where = isStaff ? {} : { status: "published", isPublished: true };
    const quizzes = await Quiz.findAll({
      where,
      attributes: ["id", "title", "description", "durationMinutes", "status", "allowMultipleAttempts", "randomizeQuestions", "randomizeOptions", "createdAt", "updatedAt"],
      include: [
        { model: Subject, attributes: ["id", "name"], required: false },
        { model: User, attributes: ["id", "name"], required: false },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.json({ success: true, data: quizzes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const shuffle = (arr) => {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
};

exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [{ model: QuizQuestion }, { model: Subject, attributes: ["id", "name"], required: false }],
    });
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found." });

    const isStudent = req.user.role === "student";
    if (isStudent && (quiz.status !== "published" || !quiz.isPublished)) {
      return res.status(403).json({ success: false, message: "Quiz is not available." });
    }

    let questions = quiz.QuizQuestions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: isStudent ? undefined : q.correctAnswer,
      difficulty: q.difficulty,
    }));
    if (isStudent && quiz.randomizeQuestions) questions = shuffle(questions);
    if (isStudent && quiz.randomizeOptions) {
      questions = questions.map((q) => ({ ...q, options: shuffle(q.options) }));
    }

    return res.json({
      success: true,
      data: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        durationMinutes: quiz.durationMinutes,
        status: quiz.status,
        allowMultipleAttempts: quiz.allowMultipleAttempts,
        Subject: quiz.Subject,
        QuizQuestions: questions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};