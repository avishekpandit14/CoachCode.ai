const { Attempt, Quiz, QuizQuestion, User } = require("../models");

exports.startAttempt = async (req, res) => {
  try {
    const quizId = parseInt(req.params.id, 10);
    const quiz = await Quiz.findByPk(quizId);
    if (!quiz || quiz.status !== "published" || !quiz.isPublished) {
      return res.status(404).json({ success: false, message: "Quiz not available." });
    }

    if (!quiz.allowMultipleAttempts) {
      const existingSubmitted = await Attempt.findOne({ where: { quizId, studentId: req.user.id, isSubmitted: true } });
      if (existingSubmitted) {
        return res.status(400).json({ success: false, message: "Multiple attempts are disabled for this quiz." });
      }
    }

    let attempt = await Attempt.findOne({ where: { quizId, studentId: req.user.id, isSubmitted: false }, order: [["createdAt", "DESC"]] });
    if (!attempt) {
      attempt = await Attempt.create({
        quizId,
        studentId: req.user.id,
        answers: { responses: {}, meta: { startedAt: new Date().toISOString() } },
        score: 0,
      });
    }
    return res.status(201).json({ success: true, data: { attemptId: attempt.id, startedAt: attempt.answers?.meta?.startedAt, answers: attempt.answers?.responses || {} } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.autoSaveAttempt = async (req, res) => {
  try {
    const attempt = await Attempt.findOne({
      where: { id: req.params.attemptId, quizId: req.params.id, studentId: req.user.id },
    });
    if (!attempt) return res.status(404).json({ success: false, message: "Attempt not found." });
    if (attempt.isSubmitted) return res.status(400).json({ success: false, message: "Attempt already submitted." });

    const responses = req.body?.answers || {};
    attempt.answers = {
      ...(attempt.answers || {}),
      responses,
      meta: {
        ...(attempt.answers?.meta || {}),
        lastSavedAt: new Date().toISOString(),
      },
    };
    await attempt.save();
    return res.json({ success: true, message: "Progress saved." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const quizId = parseInt(req.params.id, 10);
    const { attemptId, answers, startedAt } = req.body || {};
    const quiz = await Quiz.findByPk(quizId);
    if (!quiz || quiz.status !== "published") {
      return res.status(404).json({ success: false, message: "Quiz not available." });
    }

    let attempt = null;
    if (attemptId) {
      attempt = await Attempt.findOne({ where: { id: attemptId, quizId, studentId: req.user.id } });
    }
    if (!attempt) {
      attempt = await Attempt.create({
        quizId,
        studentId: req.user.id,
        answers: { responses: {} },
        score: 0,
      });
    }
    if (attempt.isSubmitted) {
      return res.status(400).json({ success: false, message: "This attempt is already submitted." });
    }

    const mergedAnswers = answers || attempt.answers?.responses || {};
    const questions = await QuizQuestion.findAll({ where: { quizId }, order: [["id", "ASC"]] });
    if (!questions.length) return res.status(400).json({ success: false, message: "Quiz has no questions." });

    let score = 0;
    const result = questions.map((q) => {
      const selected = mergedAnswers[q.id];
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) score += 1;
      return {
        questionId: q.id,
        questionText: q.questionText,
        options: q.options,
        selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
      };
    });

    const total = questions.length;
    const accuracy = Number(((score / total) * 100).toFixed(2));
    const start = startedAt ? new Date(startedAt) : new Date(attempt.answers?.meta?.startedAt || attempt.createdAt);
    const submittedAt = new Date();
    const timeTakenSeconds = Math.max(0, Math.floor((submittedAt.getTime() - start.getTime()) / 1000));

    attempt.score = score;
    attempt.isSubmitted = true;
    attempt.submittedAt = submittedAt;
    attempt.answers = {
      responses: mergedAnswers,
      result,
      meta: {
        ...(attempt.answers?.meta || {}),
        startedAt: start.toISOString(),
        submittedAt: submittedAt.toISOString(),
        timeTakenSeconds,
        accuracy,
        totalQuestions: total,
      },
    };
    await attempt.save();

    return res.json({ success: true, score, total, accuracy, timeTakenSeconds, result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAttempts = async (req, res) => {
  try {
    const sortBy = req.query.sortBy === "score" ? "score" : "createdAt";
    const sortOrder = req.query.order === "asc" ? "ASC" : "DESC";
    const attempts = await Attempt.findAll({
      where: { quizId: req.params.id, isSubmitted: true },
      include: [{ model: User, attributes: ["id", "name", "email"] }],
      order: [[sortBy, sortOrder]],
    });

    const data = attempts.map((a) => {
      const meta = a.answers?.meta || {};
      return {
        id: a.id,
        student: a.User,
        score: a.score,
        totalQuestions: meta.totalQuestions || 0,
        accuracy: meta.accuracy || 0,
        timeTakenSeconds: meta.timeTakenSeconds || 0,
        submittedAt: meta.submittedAt || a.submittedAt || a.updatedAt,
      };
    });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
