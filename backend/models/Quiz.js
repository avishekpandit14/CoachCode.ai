const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Quiz = sequelize.define("Quiz", {
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  subjectId: DataTypes.INTEGER,
  createdBy: DataTypes.INTEGER,
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Quiz;