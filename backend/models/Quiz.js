const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Quiz = sequelize.define("Quiz", {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: "" },
  subjectId: { type: DataTypes.INTEGER, allowNull: false },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
  durationMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
  status: {
    type: DataTypes.ENUM("draft", "published", "closed"),
    defaultValue: "draft",
  },
  allowMultipleAttempts: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  randomizeQuestions: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  randomizeOptions: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, { timestamps: true });

module.exports = Quiz;