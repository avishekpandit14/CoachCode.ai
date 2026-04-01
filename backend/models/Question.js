const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Question = sequelize.define(
  "Question",
  {
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    type: {
      type: DataTypes.ENUM("coding", "theory"),
      defaultValue: "coding",
    },
    difficulty: {
      type: DataTypes.ENUM("easy", "medium", "hard"),
      defaultValue: "medium",
    },
    companyTag: { type: DataTypes.STRING },
    topic: { type: DataTypes.STRING },
    constraints: { type: DataTypes.TEXT },
    inputFormat: { type: DataTypes.TEXT },
    outputFormat: { type: DataTypes.TEXT },
    tags: { type: DataTypes.JSON, defaultValue: [] },
    starterCode: { type: DataTypes.TEXT },
    starterTemplates: { type: DataTypes.JSON, defaultValue: {} },
    solutionCode: { type: DataTypes.TEXT },
    timeLimitSec: { type: DataTypes.FLOAT, defaultValue: 2 },
    memoryLimitKb: { type: DataTypes.INTEGER, defaultValue: 128000 },
    subjectId: { type: DataTypes.INTEGER },
    createdById: { type: DataTypes.INTEGER, allowNull: false },
  },
  { timestamps: true }
);

module.exports = Question;
