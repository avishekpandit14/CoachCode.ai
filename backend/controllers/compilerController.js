const compilerService = require("../services/compilerService");
const { Question, QuestionAttempt, QuestionTestCase } = require("../models");

const normalize = (s) => String(s ?? "").replace(/\r\n/g, "\n").trim();
const toVerdictLabel = (status) => {
  if (status === "accepted") return "Accepted";
  if (status === "wrong") return "Wrong Answer";
  if (status === "tle") return "Time Limit Exceeded";
  if (status === "error") return "Runtime Error";
  return "Pending";
};
const judgeRuntimeErrorIds = [6, 7, 8, 9, 10, 11, 12, 13, 14];
const mapStatus = (judgeStatusId, passedCount, totalCount) => {
  if (judgeStatusId === 5) return "tle";
  if (judgeStatusId === 3 && passedCount === totalCount) return "accepted";
  if (judgeRuntimeErrorIds.includes(judgeStatusId)) return "error";
  if (passedCount < totalCount) return "wrong";
  return "pending";
};
const evaluateCase = (result, expectedOutput) => {
  const judgeId = result.status?.id;
  if (judgeId === 5) return { passed: false, caseStatus: "tle" };
  if (judgeRuntimeErrorIds.includes(judgeId)) return { passed: false, caseStatus: "error" };
  const passed = normalize(result.stdout) === normalize(expectedOutput);
  return { passed, caseStatus: passed ? "passed" : "failed" };
};

exports.execute = async (req, res) => {
  try {
    const { code, language, stdin, questionId } = req.body;
    if (!code || !language) {
      return res.status(400).json({ success: false, message: "code and language are required" });
    }
    const result = await compilerService.createSubmission(code, language, stdin || "");

    const statusMap = {
      3: "accepted",
      4: "wrong",
      5: "wrong",
      6: "error",
      7: "error",
      8: "error",
      9: "error",
      10: "error",
    };
    const status = statusMap[result.status?.id] || "pending";

    if (req.user && questionId) {
      await QuestionAttempt.create({
        userId: req.user.id,
        questionId,
        code,
        language,
        status,
        score: status === "accepted" ? 100 : 0,
      });
    }

    return res.json({
      success: true,
      data: {
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        compile_output: result.compile_output || "",
        time: result.time,
        memory: result.memory,
        status: result.status?.description || "Unknown",
        exit_code: result.exit_code,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.response?.data?.message || err.message || "Execution failed" });
  }
};

exports.runQuestion = async (req, res) => {
  try {
    const questionId = parseInt(req.params.id, 10);
    const { code, language, stdin } = req.body;
    if (!code || !language) {
      return res.status(400).json({ success: false, message: "code and language are required" });
    }
    const question = await Question.findByPk(questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found." });
    const sampleCases = await QuestionTestCase.findAll({
      where: { questionId, isHidden: false },
      order: [["orderIndex", "ASC"]],
      limit: 2,
    });

    if (stdin != null && String(stdin).trim().length) {
      const result = await compilerService.createSubmission(code, language, stdin, {
        cpuTimeLimit: question.timeLimitSec ?? 2,
        memoryLimit: question.memoryLimitKb ?? 128000,
      });
      return res.json({
        success: true,
        data: {
          mode: "custom-input",
          stdout: result.stdout || "",
          stderr: result.stderr || "",
          time: result.time,
          memory: result.memory,
          status: result.status?.description || "Unknown",
        },
      });
    }

    const sampleResults = [];
    for (const tc of sampleCases) {
      const r = await compilerService.createSubmission(code, language, tc.input || "", {
        cpuTimeLimit: question.timeLimitSec ?? 2,
        memoryLimit: question.memoryLimitKb ?? 128000,
      });
      const evaluated = evaluateCase(r, tc.output);
      sampleResults.push({
        input: tc.input,
        expectedOutput: tc.output,
        actualOutput: r.stdout || "",
        status: evaluated.caseStatus,
        time: r.time,
        memory: r.memory,
      });
    }
    return res.json({ success: true, data: { mode: "sample", sampleResults } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.response?.data?.message || err.message || "Execution failed" });
  }
};

exports.submitQuestion = async (req, res) => {
  try {
    const questionId = parseInt(req.params.id, 10);
    const { code, language } = req.body;
    if (!code || !language) {
      return res.status(400).json({ success: false, message: "code and language are required" });
    }
    const question = await Question.findByPk(questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found." });
    const cases = await QuestionTestCase.findAll({
      where: { questionId },
      order: [["orderIndex", "ASC"]],
    });
    if (!cases.length) return res.status(400).json({ success: false, message: "No test cases configured." });

    const sampleResults = [];
    let passedCount = 0;
    let maxTime = 0;
    let maxMemory = 0;
    let failedJudgeStatus = null;

    for (const tc of cases) {
      const r = await compilerService.createSubmission(code, language, tc.input || "", {
        cpuTimeLimit: question.timeLimitSec ?? 2,
        memoryLimit: question.memoryLimitKb ?? 128000,
      });
      const evaluated = evaluateCase(r, tc.output);
      const passed = evaluated.passed;
      if (passed) passedCount += 1;
      if (r.time != null) maxTime = Math.max(maxTime, Number(r.time) || 0);
      if (r.memory != null) maxMemory = Math.max(maxMemory, Number(r.memory) || 0);
      if (!passed && failedJudgeStatus == null) failedJudgeStatus = r.status?.id;
      if (!tc.isHidden) {
        sampleResults.push({
          input: tc.input,
          expectedOutput: tc.output,
          actualOutput: r.stdout || "",
          status: evaluated.caseStatus,
        });
      }
    }

    const totalCount = cases.length;
    const hiddenTotal = cases.filter((c) => c.isHidden).length;
    const samplePassed = sampleResults.filter((s) => s.status === "passed").length;
    const status = mapStatus(failedJudgeStatus || 3, passedCount, totalCount);
    const attempt = await QuestionAttempt.create({
      userId: req.user.id,
      questionId,
      code,
      language,
      status,
      runType: "submit",
      score: Math.round((passedCount / totalCount) * 100),
      passedCount,
      totalCount,
      executionTime: maxTime,
      memoryUsage: maxMemory,
      resultDetails: { sampleResults },
    });

    return res.json({
      success: true,
      data: {
        attemptId: attempt.id,
        status,
        verdict: toVerdictLabel(status),
        passedCount,
        totalCount,
        executionTime: maxTime,
        memoryUsage: maxMemory,
        sampleResults,
        hiddenSummary: {
          total: hiddenTotal,
          passed: Math.max(passedCount - samplePassed, 0),
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.response?.data?.message || err.message || "Submission failed" });
  }
};

exports.languages = (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 54, name: "C++" },
      { id: 71, name: "Python" },
      { id: 62, name: "Java" },
    ],
  });
};
