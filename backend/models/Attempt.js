const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Attempt = sequelize.define("Attempt", {
  quizId: DataTypes.INTEGER,
  studentId: DataTypes.INTEGER,
  answers: DataTypes.JSON,
  score: DataTypes.INTEGER,
});

module.exports = Attempt;