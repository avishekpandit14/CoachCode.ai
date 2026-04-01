const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Attempt = sequelize.define("Attempt", {
  quizId: { type: DataTypes.INTEGER, allowNull: false },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  answers: { type: DataTypes.JSON, defaultValue: {} },
  score: { type: DataTypes.INTEGER, defaultValue: 0 },
  isSubmitted: { type: DataTypes.BOOLEAN, defaultValue: false },
  submittedAt: { type: DataTypes.DATE, allowNull: true },
}, { timestamps: true });

module.exports = Attempt;