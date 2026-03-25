import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    api.get(`/quizzes/${id}`)
      .then(res => setQuiz(res.data.data))
      .catch(console.error);
  }, [id]);

  const handleSelect = (qId, optionIndex) => {
    setAnswers({ ...answers, [qId]: optionIndex });
  };

  const handleSubmit = async () => {
    const res = await api.post(`/quizzes/${id}/submit`, { answers });

    navigate(`/quiz/${id}/result`, {
      state: res.data
    });
  };

  if (!quiz) return <p>Loading...</p>;

  return (
    <div className="container">
      <h2>{quiz.title}</h2>

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

      <button onClick={handleSubmit}>Submit Quiz</button>
    </div>
  );
}