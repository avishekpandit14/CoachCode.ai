const { Op } = require("sequelize");
const { Question, Subject, User, QuestionAttempt, QuestionTestCase } = require("../models");

exports.list = async (req, res) => {
  try {
    const { subjectId, difficulty, company, type, topic, status } = req.query;
    const where = {};
    if (subjectId) where.subjectId = subjectId;
    if (difficulty) where.difficulty = difficulty;
    if (company) where.companyTag = { [Op.like]: `%${company}%` };
    if (type) where.type = type;
    if (topic) where.topic = topic;

    const questions = await Question.findAll({
      where,
      include: [
        { model: Subject, as: "Subject", attributes: ["id", "name", "slug"], required: false },
        { model: User, as: "User", attributes: ["id", "name"], required: false },
      ],
      order: [["createdAt", "DESC"]],
    });
    const acceptedAttempts = await QuestionAttempt.findAll({
      where: { userId: req.user.id, status: "accepted", runType: "submit" },
      attributes: ["questionId"],
      group: ["questionId"],
    });
    const solvedSet = new Set(acceptedAttempts.map((a) => a.questionId));
    let mapped = questions.map((q) => ({ ...q.toJSON(), solved: solvedSet.has(q.id) }));
    if (status === "solved") mapped = mapped.filter((q) => q.solved);
    if (status === "unsolved") mapped = mapped.filter((q) => !q.solved);
    return res.json({ success: true, data: mapped });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id, {
      include: [
        { model: Subject, as: "Subject", attributes: ["id", "name", "slug"] },
        { model: User, as: "User", attributes: ["id", "name"] },
        {
          model: QuestionTestCase,
          as: "TestCases",
          attributes: ["id", "input", "output", "isHidden", "orderIndex"],
          required: false,
        },
      ],
    });
    if (!question) return res.status(404).json({ success: false, message: "Question not found." });
    const data = question.toJSON();
    data.TestCases = (data.TestCases || [])
      .filter((tc) => !tc.isHidden)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      difficulty,
      companyTag,
      starterCode,
      starterTemplates,
      solutionCode,
      subjectId,
      topic,
      constraints,
      inputFormat,
      outputFormat,
      tags,
      timeLimitSec,
      memoryLimitKb,
      testCases,
    } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required." });
    }
    const question = await Question.create({
      title,
      description,
      type: type || "coding",
      difficulty: difficulty || "medium",
      companyTag: companyTag || null,
      topic: topic || null,
      constraints: constraints || null,
      inputFormat: inputFormat || null,
      outputFormat: outputFormat || null,
      tags: Array.isArray(tags) ? tags : [],
      starterCode: starterCode || null,
      starterTemplates: starterTemplates || {},
      solutionCode: solutionCode || null,
      timeLimitSec: timeLimitSec != null ? Number(timeLimitSec) : 2,
      memoryLimitKb: memoryLimitKb != null ? parseInt(memoryLimitKb, 10) : 128000,
      subjectId: subjectId ? parseInt(subjectId, 10) : null,
      createdById: req.user.id,
    });
    if (Array.isArray(testCases) && testCases.length) {
      await QuestionTestCase.bulkCreate(
        testCases.map((t, idx) => ({
          questionId: question.id,
          input: t.input || "",
          output: t.output || t.expectedOutput || "",
          isHidden: !!t.isHidden,
          orderIndex: idx,
        }))
      );
    }
    return res.status(201).json({ success: true, data: question });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: "Question not found." });
    const fields = [
      "title",
      "description",
      "type",
      "difficulty",
      "companyTag",
      "topic",
      "constraints",
      "inputFormat",
      "outputFormat",
      "tags",
      "starterCode",
      "starterTemplates",
      "solutionCode",
      "timeLimitSec",
      "memoryLimitKb",
      "subjectId",
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) question[f] = f === "subjectId" ? (req.body[f] ? parseInt(req.body[f], 10) : null) : req.body[f];
    });
    await question.save();
    if (Array.isArray(req.body.testCases)) {
      await QuestionTestCase.destroy({ where: { questionId: question.id } });
      await QuestionTestCase.bulkCreate(
        req.body.testCases.map((t, idx) => ({
          questionId: question.id,
          input: t.input || "",
          output: t.output || t.expectedOutput || "",
          isHidden: !!t.isHidden,
          orderIndex: idx,
        }))
      );
    }
    return res.json({ success: true, data: question });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: "Question not found." });
    await question.destroy();
    return res.json({ success: true, message: "Question deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitAttempt = async (req, res) => {
  try {
    const { code, language, status, score } = req.body;
    const questionId = parseInt(req.params.id, 10);
    const attempt = await QuestionAttempt.create({
      userId: req.user.id,
      questionId,
      code: code || null,
      language: language || null,
      status: status || "pending",
      score: score != null ? score : null,
    });
    return res.status(201).json({ success: true, data: attempt });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMySubmissions = async (req, res) => {
  try {
    const { questionId, status, language } = req.query;
    const where = { userId: req.user.id, runType: "submit" };
    if (questionId) where.questionId = parseInt(questionId, 10);
    if (status) where.status = status;
    if (language) where.language = language;
    const submissions = await QuestionAttempt.findAll({
      where,
      include: [{ model: Question, attributes: ["id", "title", "topic", "difficulty"] }],
      order: [["createdAt", "DESC"]],
      limit: 200,
    });
    return res.json({ success: true, data: submissions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const questions = await Question.findAll({
      where: { type: "coding" },
      attributes: ["id", "topic"],
    });
    const accepted = await QuestionAttempt.findAll({
      where: { userId: req.user.id, status: "accepted", runType: "submit" },
      attributes: ["questionId"],
      group: ["questionId"],
    });
    const solvedSet = new Set(accepted.map((a) => a.questionId));
    const topicStats = {};
    questions.forEach((q) => {
      const topic = q.topic || "General";
      if (!topicStats[topic]) topicStats[topic] = { total: 0, solved: 0 };
      topicStats[topic].total += 1;
      if (solvedSet.has(q.id)) topicStats[topic].solved += 1;
    });
    const topicProgress = Object.entries(topicStats).map(([topic, v]) => ({
      topic,
      total: v.total,
      solved: v.solved,
      progress: v.total ? Number(((v.solved / v.total) * 100).toFixed(2)) : 0,
    }));
    return res.json({
      success: true,
      data: {
        solved: solvedSet.size,
        total: questions.length,
        unsolved: Math.max(questions.length - solvedSet.size, 0),
        topicProgress,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
