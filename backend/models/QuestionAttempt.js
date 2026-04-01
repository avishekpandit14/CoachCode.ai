const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const QuestionAttempt = sequelize.define(
  "QuestionAttempt",
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    questionId: { type: DataTypes.INTEGER, allowNull: false },
    code: { type: DataTypes.TEXT },
    language: { type: DataTypes.STRING },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "wrong", "error", "tle"),
      defaultValue: "pending",
    },
    runType: {
      type: DataTypes.ENUM("run", "submit"),
      defaultValue: "submit",
    },
    score: { type: DataTypes.INTEGER },
    passedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    executionTime: { type: DataTypes.FLOAT, allowNull: true },
    memoryUsage: { type: DataTypes.INTEGER, allowNull: true },
    resultDetails: { type: DataTypes.JSON, defaultValue: {} },
    submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { timestamps: true }
);

module.exports = QuestionAttempt;
