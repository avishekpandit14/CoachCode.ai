const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const QuestionTestCase = sequelize.define(
  "QuestionTestCase",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    questionId: { type: DataTypes.INTEGER, allowNull: false, field: "question_id" },
    input: { type: DataTypes.TEXT, allowNull: false },
    output: { type: DataTypes.TEXT, allowNull: false, field: "expectedOutput" },
    isHidden: { type: DataTypes.BOOLEAN, defaultValue: false, field: "is_hidden" },
    orderIndex: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: "test_cases", timestamps: true }
);

module.exports = QuestionTestCase;
