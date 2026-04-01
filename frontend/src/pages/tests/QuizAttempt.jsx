import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [remaining, setRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [attemptMeta] = useState(() => ({
    attemptId: state?.attemptId || null,
    startedAt: state?.startedAt || new Date().toISOString(),
  }));

  useEffect(() => {
    api.get(`/quizzes/${id}`)
      .then((res) => {
        const data = res.data?.data;
        setQuiz(data);
        setRemaining((data?.durationMinutes || 30) * 60);
      })
      .catch(() => toast.error("Failed to load quiz"));
  }, [id]);

  useEffect(() => {
    if (state?.answers && Object.keys(state.answers).length) {
      setAnswers(state.answers);
    }
  }, [state]);

  useEffect(() => {
    if (!remaining || submitting) return;
    const t = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [remaining, submitting]);

  const handleSelect = (qId, optionIndex) => {
    setAnswers({ ...answers, [qId]: optionIndex });
  };

  useEffect(() => {
    if (!attemptMeta.attemptId) return;
    const t = setTimeout(() => {
      api.put(`/quizzes/${id}/attempt/${attemptMeta.attemptId}/autosave`, { answers }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [answers, id, attemptMeta.attemptId]);

  const handleSubmit = async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/quizzes/${id}/submit`, {
        answers,
        attemptId: attemptMeta.attemptId,
        startedAt: attemptMeta.startedAt,
      });
      navigate(`/quiz/${id}/result`, { state: res.data });
      if (!auto) toast.success("Quiz submitted");
    } catch (e) {
      toast.error(e.response?.data?.message || "Submission failed");
      setSubmitting(false);
    }
  };

  if (!quiz) return <p>Loading...</p>;

  return (
    <div className="container">
      <h2>{quiz.title}</h2>
      <p style={{ color: "var(--text-muted)" }}>
        Time left: {Math.floor(remaining / 60)}m {remaining % 60}s
      </p>

      {quiz.QuizQuestions.map((q, index) => (
        <div key={q.id} className="card">
          <p>{index + 1}. {q.questionText}</p>

          {q.options.map((opt, i) => (
            <div key={i}>
              <input
                type="radio"
                name={`q-${q.id}`}
                onChange={() => handleSelect(q.id, i)}
              />
              {opt}
            </div>
          ))}
        </div>
      ))}

      <button className="btn btn-primary" onClick={() => handleSubmit(false)} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Quiz"}
      </button>
    </div>
  );
}