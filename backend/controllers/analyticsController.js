const analyticsService = require("../services/analyticsService");

exports.dashboard = async (req, res) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    return res.json({ success: true, data: stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.weeklyGrowth = async (req, res) => {
  try {
    const data = await analyticsService.getWeeklyGrowth();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.studentDashboard = async (req, res) => {
  try {
    const data = await analyticsService.getStudentDashboardStats(req.user.id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
