const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const QuizQuestion = sequelize.define("QuizQuestion", {
  quizId: { type: DataTypes.INTEGER, allowNull: false },
  questionText: { type: DataTypes.TEXT, allowNull: false },
  options: { type: DataTypes.JSON, allowNull: false },
  correctAnswer: { type: DataTypes.INTEGER, allowNull: false },
  difficulty: {
    type: DataTypes.ENUM("easy", "medium", "hard"),
    defaultValue: "medium",
  },
}, { timestamps: true });

module.exports = QuizQuestion;