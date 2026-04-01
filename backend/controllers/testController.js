const { Test, TestQuestion, Question, User, TestAttempt } = require("../models");

exports.list = async (req, res) => {
  try {
    const tests = await Test.findAll({
      include: [{ model: User, as: "User", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
    });
    return res.json({ success: true, data: tests });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id, {
      include: [
        { model: User, as: "User", attributes: ["id", "name"] },
        { model: Question, as: "Questions", through: { attributes: ["orderIndex", "marks"] } },
      ],
    });
    if (!test) return res.status(404).json({ success: false, message: "Test not found." });
    return res.json({ success: true, data: test });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, durationMinutes, questionIds } = req.body;
    if (!title || durationMinutes == null) {
      return res.status(400).json({ success: false, message: "Title and durationMinutes are required." });
    }
    const test = await Test.create({
      title,
      description: description || null,
      durationMinutes: parseInt(durationMinutes, 10),
      createdById: req.user.id,
    });
    if (Array.isArray(questionIds) && questionIds.length) {
      await Promise.all(
        questionIds.map((qId, i) =>
          TestQuestion.create({ testId: test.id, questionId: qId, orderIndex: i, marks: 1 })
        )
      );
    }
    return res.status(201).json({ success: true, data: test });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: "Test not found." });
    const { title, description, durationMinutes, questionIds } = req.body;
    if (title != null) test.title = title;
    if (description != null) test.description = description;
    if (durationMinutes != null) test.durationMinutes = parseInt(durationMinutes, 10);
    await test.save();
    if (Array.isArray(questionIds)) {
      await TestQuestion.destroy({ where: { testId: test.id } });
      await Promise.all(
        questionIds.map((qId, i) =>
          TestQuestion.create({ testId: test.id, questionId: qId, orderIndex: i, marks: 1 })
        )
      );
    }
    return res.json({ success: true, data: test });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: "Test not found." });
    await test.destroy();
    return res.json({ success: true, message: "Test deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.startAttempt = async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: "Test not found." });
    const attempt = await TestAttempt.create({
      userId: req.user.id,
      testId: test.id,
      startedAt: new Date(),
      score: 0,
      totalMarks: 0,
      answers: {},
    });
    return res.status(201).json({ success: true, data: attempt });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitAttempt = async (req, res) => {
  try {
    const { attemptId, score, totalMarks, answers } = req.body;
    const attempt = await TestAttempt.findOne({
      where: { id: attemptId, userId: req.user.id },
    });
    if (!attempt) return res.status(404).json({ success: false, message: "Attempt not found." });
    attempt.submittedAt = new Date();
    if (score != null) attempt.score = score;
    if (totalMarks != null) attempt.totalMarks = totalMarks;
    if (answers != null) attempt.answers = answers;
    await attempt.save();
    return res.json({ success: true, data: attempt });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
