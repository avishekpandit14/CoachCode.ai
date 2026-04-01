const { User, Material, Question, QuestionAttempt, Test, TestAttempt } = require("../models");
const { Op } = require("sequelize");

const getDashboardStats = async () => {
  const [totalUsers, totalMaterials, totalQuestions, totalTests, testAttempts] = await Promise.all([
    User.count(),
    Material.count(),
    Question.count(),
    Test.count(),
    TestAttempt.count(),
  ]);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [newUsersThisWeek, newAttemptsThisWeek] = await Promise.all([
    User.count({ where: { createdAt: { [Op.gte]: weekAgo } } }),
    TestAttempt.count({ where: { startedAt: { [Op.gte]: weekAgo } } }),
  ]);

  const roleCounts = await User.findAll({
    attributes: ["role"],
    raw: true,
  });
  const roleDistribution = roleCounts.reduce((acc, { role }) => {
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  return {
    totalUsers,
    totalMaterials,
    totalQuestions,
    totalTests,
    testAttempts,
    newUsersThisWeek,
    newAttemptsThisWeek,
    roleDistribution,
  };
};

const getWeeklyGrowth = async () => {
  const days = 7;
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const [users, attempts] = await Promise.all([
      User.count({ where: { createdAt: { [Op.gte]: d, [Op.lt]: next } } }),
      TestAttempt.count({ where: { startedAt: { [Op.gte]: d, [Op.lt]: next } } }),
    ]);
    result.push({ date: d.toISOString().slice(0, 10), users, attempts });
  }
  return result;
};

const getStudentDashboardStats = async (userId) => {
  const [totalQuestions, totalSubmissions, acceptedSubmissions, allQuestions, recentSubmissions] = await Promise.all([
    Question.count({ where: { type: "coding" } }),
    QuestionAttempt.count({ where: { userId, runType: "submit" } }),
    QuestionAttempt.count({ where: { userId, runType: "submit", status: "accepted" } }),
    Question.findAll({ where: { type: "coding" }, attributes: ["id", "topic", "difficulty"] }),
    QuestionAttempt.findAll({
      where: { userId, runType: "submit" },
      include: [{ model: Question, attributes: ["id", "title", "topic", "difficulty"] }],
      order: [["createdAt", "DESC"]],
      limit: 5,
    }),
  ]);

  const solvedRows = await QuestionAttempt.findAll({
    where: { userId, runType: "submit", status: "accepted" },
    attributes: ["questionId"],
    group: ["questionId"],
  });
  const solvedSet = new Set(solvedRows.map((r) => r.questionId));

  const topicMap = {};
  const difficultyMap = { easy: 0, medium: 0, hard: 0 };
  allQuestions.forEach((q) => {
    const topic = q.topic || "General";
    if (!topicMap[topic]) topicMap[topic] = { total: 0, solved: 0 };
    topicMap[topic].total += 1;
    if (solvedSet.has(q.id)) {
      topicMap[topic].solved += 1;
      difficultyMap[q.difficulty] = (difficultyMap[q.difficulty] || 0) + 1;
    }
  });

  const topicProgress = Object.entries(topicMap).map(([topic, v]) => ({
    topic,
    solved: v.solved,
    total: v.total,
    progress: v.total ? Number(((v.solved / v.total) * 100).toFixed(2)) : 0,
  }));

  const solvedOverTime = [];
  for (let i = 6; i >= 0; i -= 1) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const dayAccepted = await QuestionAttempt.findAll({
      where: {
        userId,
        runType: "submit",
        status: "accepted",
        createdAt: { [Op.gte]: start, [Op.lt]: end },
      },
      attributes: ["questionId"],
      group: ["questionId"],
    });
    solvedOverTime.push({
      date: start.toISOString().slice(5, 10),
      solved: dayAccepted.length,
    });
  }

  return {
    totalProblemsSolved: solvedSet.size,
    totalSubmissions,
    accuracy: totalSubmissions ? Number(((acceptedSubmissions / totalSubmissions) * 100).toFixed(2)) : 0,
    solvedVsUnsolved: { solved: solvedSet.size, unsolved: Math.max(totalQuestions - solvedSet.size, 0) },
    topicProgress,
    solvedOverTime,
    difficultyDistribution: [
      { name: "Easy", value: difficultyMap.easy || 0 },
      { name: "Medium", value: difficultyMap.medium || 0 },
      { name: "Hard", value: difficultyMap.hard || 0 },
    ],
    recentActivity: recentSubmissions.map((s) => ({
      id: s.id,
      questionTitle: s.Question?.title || `Question ${s.questionId}`,
      status: s.status,
      language: s.language,
      passedCount: s.passedCount || 0,
      totalCount: s.totalCount || 0,
      createdAt: s.createdAt,
    })),
  };
};

module.exports = { getDashboardStats, getWeeklyGrowth, getStudentDashboardStats };
