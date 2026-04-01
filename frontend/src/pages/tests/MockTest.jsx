import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const emptyQuestion = { questionText: "", options: ["", "", "", ""], correctAnswer: 0, difficulty: "medium" };

export default function MockTest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.role === "admin" || user?.role === "faculty";

  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [sortBy, setSortBy] = useState("date");

  const [showForm, setShowForm] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState(true);
  const [questions, setQuestions] = useState([{ ...emptyQuestion }]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteQuiz, setConfirmDeleteQuiz] = useState(null);

  const loadQuizzes = async () => {
    try {
      const res = await api.get("/quizzes");
      if (res.data?.success) setQuizzes(res.data.data || []);
    } catch {
      toast.error("Failed to load quizzes");
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await api.get("/subjects");
      if (res.data?.success) setSubjects(res.data.data || []);
    } catch {
      toast.error("Failed to load subjects");
    }
  };

  useEffect(() => {
    loadQuizzes();
    if (isStaff) loadSubjects();
  }, [isStaff]);

  const selectedQuiz = useMemo(() => quizzes.find((q) => q.id === selectedQuizId), [quizzes, selectedQuizId]);

  useEffect(() => {
    if (!isStaff || !selectedQuizId) return;
    const sortParam = sortBy === "score" ? "?sortBy=score&order=desc" : "?sortBy=createdAt&order=desc";
    api
      .get(`/quizzes/${selectedQuizId}/attempts${sortParam}`)
      .then((res) => {
        if (res.data?.success) setAttempts(res.data.data || []);
      })
      .catch(() => toast.error("Failed to load attempts"));
  }, [isStaff, selectedQuizId, sortBy]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSubjectId("");
    setDurationMinutes(30);
    setAllowMultipleAttempts(true);
    setQuestions([{ ...emptyQuestion }]);
    setShowForm(false);
    setEditingQuizId(null);
  };

  const loadQuizForEdit = async (quizId) => {
    try {
      const res = await api.get(`/quizzes/${quizId}`);
      const q = res.data?.data;
      if (!q) return toast.error("Failed to load quiz");
      setEditingQuizId(quizId);
      setTitle(q.title || "");
      setDescription(q.description || "");
      setSubjectId(q.Subject?.id || "");
      setDurationMinutes(q.durationMinutes || 30);
      setAllowMultipleAttempts(q.allowMultipleAttempts !== false);
      setQuestions(
        (q.QuizQuestions || []).map((item) => ({
          questionText: item.questionText,
          options: item.options || ["", "", "", ""],
          correctAnswer: item.correctAnswer ?? 0,
          difficulty: item.difficulty || "medium",
        }))
      );
      setShowForm(true);
    } catch {
      toast.error("Unable to open edit mode");
    }
  };

  const updateQuestion = (idx, key, value) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [key]: value } : q)));
  };

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = [...q.options];
        options[optIdx] = value;
        return { ...q, options };
      })
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, { ...emptyQuestion }]);
  const deleteQuestion = (idx) => setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const validateForm = () => {
    if (!title.trim() || !subjectId) return "Quiz title and subject are required.";
    if (!durationMinutes || durationMinutes < 1) return "Timer must be at least 1 minute.";
    if (!questions.length) return "At least one question is required.";
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!q.questionText.trim()) return `Question ${i + 1} text is required.`;
      if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((opt) => !String(opt).trim())) {
        return `All 4 options are required for Question ${i + 1}.`;
      }
      if (![0, 1, 2, 3].includes(Number(q.correctAnswer))) return `Correct answer must be set for Question ${i + 1}.`;
    }
    return null;
  };

  const saveQuiz = async () => {
    const validation = validateForm();
    if (validation) return toast.error(validation);
    setSubmitting(true);
    try {
      let quizId = editingQuizId;
      if (!quizId) {
        const createRes = await api.post("/quizzes", {
          title,
          description,
          subjectId,
          durationMinutes,
          allowMultipleAttempts,
        });
        quizId = createRes.data?.data?.id;
      } else {
        await api.put(`/quizzes/${quizId}`, {
          title,
          description,
          subjectId,
          durationMinutes,
          allowMultipleAttempts,
        });
      }
      await api.put(`/quizzes/${quizId}/questions`, { questions });
      await api.put(`/quizzes/${quizId}/publish`);
      toast.success(editingQuizId ? "Quiz updated" : "Quiz created");
      resetForm();
      loadQuizzes();
    } catch (e) {
      toast.error(e.response?.data?.message || "Unable to save quiz");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1>Mock Tests</h1>

      {isStaff && (
        <button className="btn btn-primary" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? "Cancel" : "Create Quiz"}
        </button>
      )}

      {showForm && isStaff && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>{editingQuizId ? "Edit Quiz" : "Create Quiz"}</h3>
          <input placeholder="Quiz title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={{ marginTop: 8 }}>
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input type="number" min="1" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} placeholder="Timer in minutes" style={{ marginTop: 8 }} />
          <label style={{ marginTop: 8, display: "block" }}>
            <input type="checkbox" checked={allowMultipleAttempts} onChange={(e) => setAllowMultipleAttempts(e.target.checked)} /> Allow multiple attempts
          </label>

          <h4 style={{ margin: "12px 0 8px" }}>Questions Preview</h4>
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong>Question {qIdx + 1}</strong>
                {questions.length > 1 && <button className="btn" onClick={() => deleteQuestion(qIdx)}>Delete Question</button>}
              </div>
              <input placeholder="Question text" value={q.questionText} onChange={(e) => updateQuestion(qIdx, "questionText", e.target.value)} />
              {q.options.map((opt, optIdx) => (
                <div key={optIdx} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                  <input type="radio" name={`correct-${qIdx}`} checked={q.correctAnswer === optIdx} onChange={() => updateQuestion(qIdx, "correctAnswer", optIdx)} />
                  <input placeholder={`Option ${String.fromCharCode(65 + optIdx)}`} value={opt} onChange={(e) => updateOption(qIdx, optIdx, e.target.value)} />
                </div>
              ))}
            </div>
          ))}
          <button className="btn" onClick={addQuestion}>Add Question</button>
          <button className="btn btn-primary" onClick={saveQuiz} disabled={submitting} style={{ marginLeft: 8 }}>
            {submitting ? "Saving..." : "Publish Quiz"}
          </button>
        </div>
      )}

      {quizzes.length === 0 ? (
        <p>No quizzes available</p>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {quizzes.map((q) => (
            <div key={q.id} className="card">
              <h3>{q.title}</h3>
              <p>{q.description}</p>
              <p style={{ color: "var(--text-muted)" }}>
                Subject: {q.Subject?.name || "General"} | Timer: {q.durationMinutes || 30} min | Status: {q.status}
              </p>

              {user?.role === "student" ? (
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      const res = await api.post(`/quizzes/${q.id}/attempt`);
                      navigate(`/quiz/${q.id}`, { state: res.data?.data });
                    } catch (e) {
                      toast.error(e.response?.data?.message || "Unable to start quiz");
                    }
                  }}
                >
                  Start Quiz
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn" onClick={() => loadQuizForEdit(q.id)}>Edit Quiz</button>
                  <button className="btn" onClick={() => setConfirmDeleteQuiz(q)}>Delete Quiz</button>
                  <button className="btn" onClick={() => setSelectedQuizId(q.id)}>View Attempts</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isStaff && selectedQuiz && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ marginTop: 0 }}>Attempts - {selectedQuiz.title}</h3>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">Sort by date</option>
              <option value="score">Sort by score</option>
            </select>
          </div>
          {attempts.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No attempts yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">Student Name</th>
                  <th align="left">Score</th>
                  <th align="left">Accuracy</th>
                  <th align="left">Time Taken</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.student?.name || "Unknown"}</td>
                    <td>{a.score}/{a.totalQuestions || "-"}</td>
                    <td>{a.accuracy}%</td>
                    <td>{Math.floor((a.timeTakenSeconds || 0) / 60)}m {(a.timeTakenSeconds || 0) % 60}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {confirmDeleteQuiz && (
        <div className="card" style={{ marginTop: 16, border: "1px solid var(--danger)" }}>
          <h3 style={{ marginTop: 0 }}>Confirm Delete</h3>
          <p>Delete "{confirmDeleteQuiz.title}" and all questions/attempts?</p>
          <button
            className="btn"
            onClick={async () => {
              try {
                await api.delete(`/quizzes/${confirmDeleteQuiz.id}`);
                toast.success("Quiz deleted");
                if (selectedQuizId === confirmDeleteQuiz.id) setSelectedQuizId(null);
                setConfirmDeleteQuiz(null);
                loadQuizzes();
              } catch (e) {
                toast.error(e.response?.data?.message || "Delete failed");
              }
            }}
          >
            Yes, Delete
          </button>
          <button className="btn" onClick={() => setConfirmDeleteQuiz(null)} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}