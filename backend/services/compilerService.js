const axios = require("axios");

const JUDGE0_BASE = process.env.JUDGE0_BASE || "https://ce.judge0.com";
const JUDGE0_KEY = process.env.JUDGE0_API_KEY || "";

// Judge0 language IDs: https://github.com/judge0/judge0/blob/master/docs/api/languages.md
const LANGUAGE_IDS = {
  cpp: 54,
  c: 50,
  python: 71,
  java: 62,
  javascript: 63,
  go: 60,
  rust: 73,
};

const getLanguageId = (lang) => LANGUAGE_IDS[lang?.toLowerCase()] ?? 71;

const createSubmission = async (sourceCode, language, stdin = "", limits = {}) => {
  const headers = { "Content-Type": "application/json" };
  if (JUDGE0_KEY) headers["X-Auth-Token"] = JUDGE0_KEY;

  const { data } = await axios.post(
    `${JUDGE0_BASE}/submissions?base64_encoded=false&wait=true`,
    {
      source_code: sourceCode,
      language_id: getLanguageId(language),
      stdin: stdin,
      cpu_time_limit: limits.cpuTimeLimit ?? 5,
      memory_limit: limits.memoryLimit ?? 128000,
    },
    { headers, timeout: 30000 }
  );
  return data;
};

const getSubmission = async (token) => {
  const headers = {};
  if (JUDGE0_KEY) headers["X-Auth-Token"] = JUDGE0_KEY;
  const { data } = await axios.get(`${JUDGE0_BASE}/submissions/${token}?base64_encoded=false`, { headers });
  return data;
};

module.exports = { createSubmission, getSubmission, getLanguageId, LANGUAGE_IDS };
