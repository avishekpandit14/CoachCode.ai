import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function MockTest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // create quiz states
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");

  // 📌 fetch quizzes
  const loadQuizzes = () => {
    api.get("/quizzes")
      .then(res => setQuizzes(res.data.data))
      .catch(console.error);
  };

  // 📌 fetch subjects
  const loadSubjects = () => {
    api.get("/subjects")
      .then(res => setSubjects(res.data.data))
      .catch(console.error);
  };

  useEffect(() => {
    loadQuizzes();
    loadSubjects();
  }, []);

  // 📌 create quiz
  const handleCreateQuiz = async () => {
    if (!title || !subjectId) {
      alert("Title & Subject required");
      return;
    }

    const res = await api.post("/quizzes", {
      title,
      description,
      subjectId
    });

    alert("Quiz Created ✅");

    setShowForm(false);
    setTitle("");
    setDescription("");
    setSubjectId("");

    loadQuizzes();
  };

  return (
    <div className="container">
      <h1>Mock Tests</h1>

      {/* 🔥 CREATE BUTTON (ONLY ADMIN/FACULTY) */}
      {(user?.role === "admin" || user?.role === "faculty") && (
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            marginBottom: "1rem",
            padding: "0.6rem 1rem",
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          {showForm ? "Cancel" : "+ Create Quiz"}
        </button>
      )}

      {/* 🔥 CREATE QUIZ FORM */}
      {showForm && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3>Create Quiz</h3>

          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* 🔥 SUBJECT DROPDOWN */}
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button onClick={handleCreateQuiz}>
            Create Quiz
          </button>
        </div>
      )}

      {/* 📌 QUIZ LIST */}
      {quizzes.length === 0 ? (
        <p>No quizzes available</p>
      ) : (
        quizzes.map((q) => (
          <div key={q.id} className="card">
            <h3>{q.title}</h3>
            <p>{q.description}</p>

            <button onClick={() => navigate(`/quiz/${q.id}`)}>
              Start Quiz 🚀
            </button>
          </div>
        ))
      )}
    </div>
  );
}