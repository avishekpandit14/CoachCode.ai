const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const QuizQuestion = sequelize.define("QuizQuestion", {
  quizId: DataTypes.INTEGER,
  questionText: DataTypes.TEXT,
  options: DataTypes.JSON,
  correctAnswer: DataTypes.INTEGER,
});

module.exports = QuizQuestion;