const { QuestionTestCase } = require("../models");

exports.getByQuestion = async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId, 10);
    console.log("Question ID:", questionId);

    const testCases = await QuestionTestCase.findAll({
      where: {
        questionId: questionId,
        isHidden: false,
      },
      attributes: ["id", "input", "output", "orderIndex"],
      order: [["orderIndex", "ASC"]],
    });
    console.log("Fetched TestCases:", testCases);

    return res.json({
      success: true,
      data: testCases,
    });

  } catch (error) {
    console.error("TESTCASE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};