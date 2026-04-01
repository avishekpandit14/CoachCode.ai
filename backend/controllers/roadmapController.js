const { Roadmap, RoadmapProgress, Subject } = require("../models");

exports.list = async (req, res) => {
  try {
    const roadmaps = await Roadmap.findAll({
      include: [{ model: Subject, as: "Subject", attributes: ["id", "name", "slug"], required: false }],
      order: [["orderIndex", "ASC"], ["id", "ASC"]],
    });
    return res.json({ success: true, data: roadmaps });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const progress = await RoadmapProgress.findAll({
      where: { userId: req.user.id },
      include: [{ model: Roadmap, as: "Roadmap", include: [{ model: Subject, as: "Subject", attributes: ["id", "name"] }] }],
    });
    return res.json({ success: true, data: progress });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { status } = req.body;
    let progress = await RoadmapProgress.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!progress) return res.status(404).json({ success: false, message: "Progress not found." });
    if (status) progress.status = status;
    if (status === "completed") progress.completedAt = new Date();
    await progress.save();
    return res.json({ success: true, data: progress });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { subjectId, title, description, orderIndex } = req.body;
    if (!title) return res.status(400).json({ success: false, message: "Title is required." });
    const roadmap = await Roadmap.create({
      subjectId: subjectId ? parseInt(subjectId, 10) : null,
      title,
      description: description || null,
      orderIndex: orderIndex != null ? parseInt(orderIndex, 10) : 0,
    });
    return res.status(201).json({ success: true, data: roadmap });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.syncProgress = async (req, res) => {
  try {
    const roadmaps = await Roadmap.findAll({ attributes: ["id"] });
    for (const r of roadmaps) {
      await RoadmapProgress.findOrCreate({
        where: { userId: req.user.id, roadmapId: r.id },
        defaults: { status: "not_started" },
      });
    }
    const all = await RoadmapProgress.findAll({
      where: { userId: req.user.id },
      include: [{ model: Roadmap, as: "Roadmap" }],
    });
    return res.json({ success: true, data: all });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
