import { useState, useEffect, useMemo } from "react";
import Editor from "@monaco-editor/react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { CardSkeleton } from "../../components/common/Skeleton";



const LANGUAGES = [
  { id: "cpp", name: "C++" },
  { id: "python", name: "Python" },
  { id: "java", name: "Java" },
];

const DEFAULT_CODE = {
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    return 0;\n}`,
  python: `def solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n    }\n}`,
};

const TOPICS = [
  "Arrays",
  "Strings",
  "Linked List",
  "Stack & Queue",
  "Recursion",
  "Sorting & Searching",
  "Trees",
  "Graphs",
];

export default function Practice() {
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [questionDetails, setQuestionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [code, setCode] = useState(DEFAULT_CODE.cpp);
  const [language, setLanguage] = useState("cpp");
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("testcases");
  const [testcases, setTestcases] = useState([]);
  const [loadingTestcases, setLoadingTestcases] = useState(false);
  const [runError, setRunError] = useState("");
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem("practice_editor_font_size")) || 14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionFilter, setSubmissionFilter] = useState({ questionId: "", status: "", language: "" });

  const questionMap = useMemo(() => {
    const m = new Map();
    questions.forEach((q) => m.set(q.id, q));
    return m;
  }, [questions]);

  useEffect(() => {
    const params = {};
    if (topic) params.topic = topic;
    if (difficulty) params.difficulty = difficulty;
    if (statusFilter) params.status = statusFilter;
    params.type = "coding";
    api.get("/questions", { params })
      .then((r) => r.data.success && setQuestions(r.data.data))
      .catch(() => toast.error("Failed to load questions"))
      .finally(() => setLoading(false));
  }, [topic, difficulty, statusFilter]);

  const fetchTestCases = async (id) => {
    try {
      setLoadingTestcases(true);
      const r = await api.get(`/testcases/${id}`);
      if (r.data?.success && Array.isArray(r.data.data)) {
        setTestcases(r.data.data);
      } else {
        setTestcases([]);
      }
    } catch (err) {
      console.error(err);
      setTestcases([]);
    } finally {
      setLoadingTestcases(false);
    }
  };

  useEffect(() => {
    if (!selected?.id) return;
    api.get(`/questions/${selected.id}`)
      .then((r) => {
        if (!r.data?.success) return;
        setQuestionDetails(r.data.data);
      })
      .catch(() => toast.error("Failed to load question details"));
    fetchTestCases(selected.id);
  }, [selected?.id]);

  useEffect(() => {
    console.log("Testcases:", testcases);
  }, [testcases]);

  useEffect(() => {
    localStorage.setItem("practice_editor_font_size", String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    if (questionDetails?.starterTemplates?.[language]) setCode(questionDetails.starterTemplates[language]);
    else if (questionDetails?.starterCode) setCode(questionDetails.starterCode);
    else setCode(DEFAULT_CODE[language] || DEFAULT_CODE.cpp);
  }, [questionDetails?.id, language]);

  const loadProgress = () => {
    api.get("/questions/progress/summary")
      .then((r) => r.data?.success && setProgress(r.data.data))
      .catch(() => {});
  };

  const loadSubmissions = () => {
    const params = {};
    if (submissionFilter.questionId) params.questionId = submissionFilter.questionId;
    if (submissionFilter.status) params.status = submissionFilter.status;
    if (submissionFilter.language) params.language = submissionFilter.language;
    api.get("/questions/submissions/mine", { params })
      .then((r) => r.data?.success && setSubmissions(r.data.data || []))
      .catch(() => toast.error("Failed to load submissions"));
  };

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [submissionFilter.questionId, submissionFilter.status, submissionFilter.language]);

  const handleRun = async () => {
  if (!selected?.id) return toast.error("Select a question first");

  setRunning(true);
  setOutput(null);
  setRunError("");
  setActiveTab("output");

  try {
    const { data } = await api.post(`/compiler/questions/${selected.id}/run`, {
      code,
      language,
      stdin,
    });

    if (data.success) setOutput(data.data);
    else toast.error(data.message || "Execution failed");

  } catch (e) {
    toast.error(e.response?.data?.message || "Execution failed");
    setRunError(e.response?.data?.message || e.message);
  } finally {
    setRunning(false);
  }
};

  const handleSubmit = async () => {
    if (!selected?.id) return toast.error("Select a question first");
    if (!loadingTestcases && testcases.length === 0) {
      return toast.error("No test cases configured");
    }
    setSubmitting(true);
    setRunError("");
    setActiveTab("output");
    try {
      const { data } = await api.post(`/compiler/questions/${selected.id}/submit`, { code, language });
      if (data.success) {
        setOutput(data.data);
        toast.success("Submission evaluated");
        loadProgress();
        loadSubmissions();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "none", padding: 0 }}>
      <div style={{ display: "flex", height: "calc(100vh - 120px)", minHeight: 400 }}>
        <aside
          style={{
            width: 320,
            borderRight: "1px solid var(--border)",
            overflow: "auto",
            background: "var(--surface)",
          }}
        >
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ margin: "0 0 0.5rem" }}>Questions</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{ padding: "0.4rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }}
              >
                <option value="">All Topics</option>
                {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ padding: "0.4rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }}
              >
                <option value="">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "0.4rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }}
              >
                <option value="">All Status</option>
                <option value="solved">Solved</option>
                <option value="unsolved">Unsolved</option>
              </select>
            </div>
            {progress && (
              <p style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 12 }}>
                Solved: {progress.solved}/{progress.total}
              </p>
            )}
          </div>
          {loading ? (
            <div style={{ padding: 16 }}><CardSkeleton /></div>
          ) : questions.length === 0 ? (
            <div style={{ padding: 16, color: "var(--text-muted)" }}>No questions</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {questions.map((q) => (
                <li
                  key={q.id}
                  onClick={() => setSelected(q)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    background: selected?.id === q.id ? "var(--primary)" : "transparent",
                    color: selected?.id === q.id ? "#fff" : "var(--text)",
                  }}
                >
                  <strong style={{ fontSize: 14 }}>{q.title}</strong>
                  <span style={{ fontSize: 12, opacity: 0.8, marginLeft: 8 }}>{q.difficulty} · {q.topic || "General"} · {q.solved ? "Solved" : "Unsolved"}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            {questionDetails && (
              <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", maxHeight: 180, overflow: "auto", background: "var(--surface)" }}>
                <h4 style={{ margin: "0 0 0.5rem" }}>{questionDetails.title}</h4>
                <p style={{ margin: "0 0 .5rem", fontSize: 14, color: "var(--text-muted)" }}>{questionDetails.description}</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                  Constraints: {questionDetails.constraints || "-"} | Input: {questionDetails.inputFormat || "-"} | Output: {questionDetails.outputFormat || "-"}
                </p>
              </div>
            )}
            <div
              style={
                isFullscreen
                  ? {
                      position: "fixed",
                      inset: 0,
                      zIndex: 40,
                      background: "var(--surface)",
                      display: "flex",
                      flexDirection: "column",
                    }
                  : { flex: 1, display: "flex", flexDirection: "column", minHeight: 200 }
              }
            >
              <div style={{ display: "flex", gap: 8, padding: "8px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{ padding: "0.4rem 0.8rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={handleRun} disabled={running}>
                  {running ? "Running..." : "Run"}
                </button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </button>
                <button className="btn" onClick={() => setCode(questionDetails?.starterTemplates?.[language] || DEFAULT_CODE[language] || "")}>
                  Reset Code
                </button>
                <button className="btn" onClick={() => setFontSize((s) => Math.min(20, s + 1))}>Zoom In</button>
                <button className="btn" onClick={() => setFontSize((s) => Math.max(14, s - 1))}>Zoom Out</button>
                <button className="btn" onClick={() => setIsFullscreen((s) => !s)}>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</button>
              </div>
              <div style={{ flex: 1, minHeight: 200 }}>
                <Editor
                  height="100%"
                  language={language === "cpp" ? "cpp" : language}
                  value={code}
                  onChange={(v) => setCode(v || "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize,
                    padding: { top: 16 },
                  }}
                />
              </div>
            </div>
            <div style={{ padding: "1rem", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
              <h4 style={{ margin: "0 0 0.5rem", fontSize: 14 }}>Input</h4>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Custom input (optional)"
                style={{
                  width: "100%",
                  minHeight: 60,
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  fontSize: 13,
                  resize: "vertical",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className={`btn ${activeTab === "testcases" ? "btn-primary" : ""}`} onClick={() => setActiveTab("testcases")}>Testcases</button>
                <button className={`btn ${activeTab === "output" ? "btn-primary" : ""}`} onClick={() => setActiveTab("output")}>Output</button>
                <button className={`btn ${activeTab === "submissions" ? "btn-primary" : ""}`} onClick={() => setActiveTab("submissions")}>Submissions</button>
                <button className="btn" onClick={() => navigator.clipboard.writeText(stdin || "")}>Copy Input</button>
              </div>
            </div>
            <div style={{ padding: "1rem", background: "var(--surface)", borderTop: "1px solid var(--border)", maxHeight: 280, overflow: "auto" }}>
              {activeTab === "testcases" && (
                <>
                  <h4 style={{ margin: "0 0 0.5rem", fontSize: 14 }}>Sample Testcases</h4>
                  {loadingTestcases ? <div style={{ color: "var(--text-muted)" }}>Loading testcases...</div> : (!loadingTestcases && testcases.length === 0) ? <div style={{ color: "var(--text-muted)" }}>No sample testcases.</div> : (
                    testcases.map((tc, idx) => {
                      const result = output?.sampleResults?.[idx];
                      return (
                        <div key={tc.id} className="card" style={{ marginBottom: 8 }}>
                          <strong>Case #{idx + 1} {result ? `- ${result.status}` : ""}</strong>
                          <pre style={{ margin: "4px 0" }}>Input: {tc.input}</pre>
                          <pre style={{ margin: "4px 0" }}>Expected: {tc.output}</pre>
                          {result && <pre style={{ margin: "4px 0" }}>Actual: {result.actualOutput}</pre>}
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {activeTab === "output" && (
                <>
                  <h4 style={{ margin: "0 0 0.5rem", fontSize: 14 }}>Output Console</h4>
                  {(running || submitting) && <p style={{ color: "var(--text-muted)" }}>Executing... please wait.</p>}
                  {runError && <p style={{ color: "var(--danger)" }}>{runError}</p>}
                  {output && (
                    <>
                      {output.mode === "sample" ? (
                        <div style={{ fontSize: 13 }}>
                          {(output.sampleResults || []).map((r, idx) => (
                            <div key={idx} style={{ marginBottom: 8 }}>
                              <strong>Sample #{idx + 1}: {r.status}</strong>
                              <pre style={{ margin: "4px 0" }}>Actual: {r.actualOutput}</pre>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <pre style={{ margin: 0, fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{output.stdout || "(empty)"}</pre>
                      )}
                      {output.stderr && <pre style={{ margin: "0.5rem 0 0", fontSize: 13, color: "var(--danger)", whiteSpace: "pre-wrap" }}>{output.stderr}</pre>}
                      {(output.time != null || output.memory != null || output.executionTime != null || output.memoryUsage != null) && (
                        <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                          Time: {output.executionTime ?? output.time ?? "-"}s · Memory: {output.memoryUsage ?? output.memory ?? "-"} KB
                        </p>
                      )}
                      {output.totalCount != null && (
                        <p style={{ margin: "0.25rem 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                          Status: {output.verdict || output.status} · Passed: {output.passedCount}/{output.totalCount}
                        </p>
                      )}
                      {output.hiddenSummary && (
                        <p style={{ margin: "0.25rem 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                          Hidden test cases: {output.hiddenSummary.passed}/{output.hiddenSummary.total} passed
                        </p>
                      )}
                    </>
                  )}
                </>
              )}

              {activeTab === "submissions" && (
                <>
                  <h4 style={{ margin: "0 0 0.5rem", fontSize: 14 }}>My Submissions</h4>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <select value={submissionFilter.questionId} onChange={(e) => setSubmissionFilter((p) => ({ ...p, questionId: e.target.value }))}>
                  <option value="">All Questions</option>
                  {questions.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
                </select>
                <select value={submissionFilter.status} onChange={(e) => setSubmissionFilter((p) => ({ ...p, status: e.target.value }))}>
                  <option value="">All Status</option>
                  <option value="accepted">Accepted</option>
                  <option value="wrong">Wrong</option>
                  <option value="tle">TLE</option>
                  <option value="error">Error</option>
                </select>
                <select value={submissionFilter.language} onChange={(e) => setSubmissionFilter((p) => ({ ...p, language: e.target.value }))}>
                  <option value="">All Languages</option>
                  {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {submissions.slice(0, 20).map((s) => (
                  <div key={s.id} style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 8, fontSize: 12 }}>
                    <strong>{questionMap.get(s.questionId)?.title || s.Question?.title || `Question ${s.questionId}`}</strong>
                    <div>{s.language} · {s.status} · {s.passedCount}/{s.totalCount}</div>
                    <div style={{ color: "var(--text-muted)" }}>{new Date(s.createdAt).toLocaleString()}</div>
                  </div>
                ))}
                {submissions.length === 0 && <div style={{ color: "var(--text-muted)" }}>No submissions yet.</div>}
              </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
